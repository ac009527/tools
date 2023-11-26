#!/usr/bin/env node
/// <reference types="zx" />
import { echo, fs, path, question } from 'zx';
import clipboard from 'clipboardy';
import { isEmpty, isObject, result } from 'lodash-es';
import json2ts from 'json2ts';
import { fileURLToPath } from 'url';

// 当前文件路径 = __filename
const filename = fileURLToPath(import.meta.url);
const cwd = process.cwd();
(async () => {
    let tableItem;
    let clipboardStr = clipboard.readSync();
    try {
        tableItem = JSON.parse(clipboardStr)
    } catch (error) {

    }
    while (!(tableItem && isObject(tableItem) && !isEmpty(tableItem))) {
        try {
            await question('请复制json: ')
            tableItem = JSON.parse(clipboard.readSync())
        } catch (error) {
            echo(error)
        }
    }

    const list = Object.keys(tableItem).map(e => {
        return `{
    title: <FormattedMessage id="template.${e}" />,
    dataIndex: '${e}',
},`
    })
    let result = json2ts.convert(JSON.stringify(tableItem));
    fs.writeFileSync(path.resolve(cwd, 'data.d.ts'), result);
    fs.writeFileSync(path.resolve(cwd, 'index.tsx'),
        fs.readFileSync(path.resolve(filename, '..', './index.tpl.tsx'))
            .toString().replace("/** columns **/", `const columns:ProColumns<RootObject>[] = [${list.join('\n')}]`)
    );

    echo(`success: ${path.resolve(cwd, 'data.d.ts')}`)
    echo(`success: ${path.resolve(cwd, 'index.tsx')}`)
    // Object.entries(tableItem).forEach(([key,v])=>{
    //     key === 1
    // })
    // tries = await question('重试次数: ', { choices: '10' });
    // sleep = await question('等待时间(默认单位ms): ', { choices: '10ms' });
    // await retry(formatTries(tries), formatSleep(sleep), () => $`${cmd?.split(/\s+/)}`);
})().catch(echo);


