#!/usr/bin/env node
/// <reference types="zx" />
import { isNumber } from 'lodash-es';
import { $, argv, echo, question } from 'zx';
import { retry } from 'zx/experimental';
import notifier from 'node-notifier'

const formatSleep = (t) => {
    return isNumber(t) || /^\d.*m?s$/.test(String(t)) ? t : 30
}

const formatTries = (t) => {
    return Number(t) > 0 ? t : 30
}

(async () => {
    if (argv.help) {
        echo(`
    -h  --help      帮助
    -t  --tries=30  设置最大重试次数: 默认30
    -s  --sleep     默认单位毫秒 支持 10 , 10ms , 10s
    案例：
    retry -t=5 -s=300ms "curl https://github.com" # 请求GitHub最大重试五次 每次失败等待300ms
    `)
        return
    }
    let tries = argv.tries || argv.t;
    let sleep = argv.sleep || argv.s;
    let cmd = argv._[0];
    if (!cmd) {
        cmd = await question('输入你需要执行重试的命令: ');
        tries = await question('重试次数: ', { choices: '30' });
        sleep = await question('等待时间(默认单位ms): ', { choices: '30ms' });
    }
    await retry(formatTries(tries), formatSleep(sleep), () => $`${cmd?.split(/\s+/)}`).then(res => {
        notifier.notify({
            title: 'success',
            message: cmd
        });
    }).catch(() => {
        notifier.notify({
            title: 'error',
            message: cmd
        });
    });
})().catch(echo);

