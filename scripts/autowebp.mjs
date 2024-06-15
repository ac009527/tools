import webp from 'webp-converter'
import fastq from 'fastq'
import { glob } from 'glob'
import os from 'os';

const q = fastq.promise(async (task) => {
    console.time(JSON.stringify(task, null, 2))
    const { input, output } = task
    await webp.cwebp(input, output, '-q 80')
    console.timeEnd(JSON.stringify(task, null, 2))
}, os.cpus().length)
// eslint-disable-next-line no-undef
const cwd = process.cwd()
const allTask = glob.sync(cwd + '/dist/**/*.{jpg,png}').map(async (input, i) => {
    await q.push({ input, output: input + '.webp' })
})
console.time('done')
Promise.all(allTask).then(() => {
    console.timeEnd('done')
})
