import { argv, glob, fs, sleep, echo, chalk } from 'zx';
import fastq from 'fastq'
import sharp from 'sharp'
import CryptoJS from 'crypto-js'

const cwd = process.cwd()

const { inputDir, quality = 80, logLevel = 'info'} = argv;

const log = {
    debug: (message) => {
        if (['debug'].includes(logLevel)) {
            echo(chalk.blue('[debug]'), message);
        }
    },
    error: (message) => {
        echo(chalk.red(message));
    },
    info: (message) => {
        if (['info'].includes(logLevel)) {
            echo(chalk.cyan('[info]'), message);
        }
    },
};

const imgFiles = await glob(`${inputDir}/**/*.{jpg,jpeg,png}`, {
    ignore: [`${inputDir}/**/*.{nocompress.jpg,nocompress.jpeg,nocompress.png}`]
});
const compressed_images_cache = await fs.readJson(`${cwd}/.compressed_images_cache.json`).catch(() => ([]));
const new_compressed_images_cache = [...compressed_images_cache];

const getFileMD5 = async (filePath) => {
    const data = await fs.readFile(filePath);
    const wordArray = CryptoJS.lib.WordArray.create(data);
    const hash = CryptoJS.MD5(wordArray);
    return hash.toString();
}

// 通过 buf 得到md5
const getBufMD5 = async (data) => {
    const wordArray = CryptoJS.lib.WordArray.create(data);
    const hash = CryptoJS.MD5(wordArray);
    return hash.toString();
}


const q = fastq.promise(async (task) => {
    const timeStart = Date.now()
    const { input, relativePath } = task
    const fileTypes = path.extname(input) === '.png' ? 'png' : 'jpeg'
    let newFileBuf;
    const oldFileSize = (await fs.stat(input)).size;
    const oldFileMd5 = await getFileMD5(input);
    log.debug(`MD5 hash of ${relativePath}: ${oldFileMd5}`);
    if (compressed_images_cache.includes(oldFileMd5)) {
        log.debug(`skip ${relativePath}`)
        return
    }
    try {
        if (fileTypes === 'png') {
            newFileBuf = await sharp(input)
                .png({ quality }).toBuffer()
        } else {
            newFileBuf = await sharp(input)
                .jpeg({ quality }).toBuffer()
        }
    } catch (error) {
        log.error(error)
        return
    }

    if (newFileBuf.length >= oldFileSize) {
        new_compressed_images_cache.push(oldFileMd5)
        log.debug(`skip ${relativePath} ${Date.now() - timeStart}ms ${formatBytes(oldFileSize)} -> ${formatBytes(newFileBuf.length)}, ${oldFileMd5}`)
        return
    }
    await fs.writeFile(input, newFileBuf)
    const newFileMd5 = await getBufMD5(newFileBuf);
    new_compressed_images_cache.push(newFileMd5)
    log.info(`done ${relativePath} ${Date.now() - timeStart}ms ${formatBytes(oldFileSize)} -> ${formatBytes(newFileBuf.length)}, ${newFileMd5}`)
}, os.cpus().length)


const allTask = imgFiles.map(input => q.push({ input: path.resolve(cwd, input), relativePath: input }))
// const allTask = ['src/games/DropBallSG/modal/PrizeModal/images/win.png'].map(input => q.push({ input: path.resolve(cwd, input), relativePath: input }))
console.time('done')
Promise.all(allTask).then(() => {
    console.timeEnd('done');
    fs.writeJson(`${cwd}/.compressed_images_cache.json`, new_compressed_images_cache, {
        spaces: 2
    })
})

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
