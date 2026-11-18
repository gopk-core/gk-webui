function extractWebUI(text) {
    const blocks = [...text.matchAll(/```(html?|css|javascript|js)\s*\n([\s\S]*?)```/gi)];
    let html = blocks.filter(b => /^html?$/i.test(b[1])).map(b => b[2]).join('\n');
    if (!html && /^\s*(?:<!doctype html|<html\b)/i.test(text))
        html = text;
    if (!html)
        return null;
    const css = blocks.filter(b => b[1].toLowerCase() === 'css').map(b => b[2]).join('\n');
    const javascript = blocks.filter(b => /^(javascript|js)$/i.test(b[1])).map(b => b[2]).join('\n');
    if (html.length + css.length + javascript.length > 48000)
        return null;
    return { html, css, javascript, capturedAt: new Date().toISOString() };
}
async function main(_, gk) {
    let captured = 0;
    const publish = () => gk.app.publish({ pages: { 'webui.status': { type: 'column', style: { padding: 16, gap: 12 }, children: [
                    { type: 'text', text: 'GK WebUI', style: { fontSize: 24, bold: true } },
                    { type: 'text', text: '从插件视图打开 WebUI 工作台。HTML/CSS/JavaScript 使用 WebView 的 Chromium 引擎，在隔离 iframe 中运行。' },
                    { type: 'text', text: '本次启动已捕获 ' + captured + ' 段网页。' },
                    { type: 'text', text: '工作台若未提供 gk.fs 桥接，请复制回复中的源码后粘贴预览。当前 SDK 未提供消息气泡内嵌 WebView 组件。' },
                    { type: 'button', text: '清除捕获', action: { type: 'event', event: 'webui.clear' } },
                    { type: 'button', text: '返回聊天', action: { type: 'navigate', value: 'host:chat' } }
                ] } },
        slots: { 'chat.composer': { type: 'column', children: [{ type: 'builtin', name: 'original' },
                    { type: 'button', text: 'WebUI · ' + captured + ' 段已捕获', action: { type: 'navigate', value: 'webui.status' } }] } },
        hooks: ['chat.afterResponse'] });
    gk.on('chat.afterResponse', async (input) => {
        try {
            if (typeof input?.text === 'string') {
                const data = extractWebUI(input.text);
                if (data) {
                    const ok = await gk.fs.write('latest.json', JSON.stringify(data));
                    if (ok !== false) {
                        captured++;
                        await publish();
                    }
                }
            }
        }
        catch { /* Preview failures must preserve the original model response. */ }
        return input;
    });
    gk.on('webui.clear', async () => { const ok = await gk.fs.write('latest.json', 'null'); if (ok === false)
        return { ok: false }; captured = 0; await publish(); return { ok: true }; });
    await publish();
}
