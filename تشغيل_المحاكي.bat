@echo off
chcp 65001 > nul
echo ===================================================================
echo     محاكي ابن الشاطر الفلكي (تشغيل فوري متزامن)
echo ===================================================================
echo.
echo جاري فحص البيئة وبدء خادم الويب المحلي...
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [✓] تم العثور على Python. جاري فتح المتصفح وتشغيل الخادم على المنفذ 8090...
    start "" http://localhost:8090/index.html
    python -m http.server 8090
    goto end
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [✓] تم العثور على مشغل Python. جاري فتح المتصفح وتشغيل الخادم على المنفذ 8090...
    start "" http://localhost:8090/index.html
    py -m http.server 8090
    goto end
)

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [✓] تم العثور على Node.js. جاري فتح المتصفح وتشغيل الخادم على المنفذ 8090...
    start "" http://localhost:8090/index.html
    node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{let f=path.join('.',req.url.split('?')[0]);if(f==='.')f='./index.html';fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();}else{const m={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':m[path.extname(f)]||'text/plain'});res.end(d);}});}).listen(8090);"
    goto end
)

echo [i] جاري فتح ملف index.html مباشرة في المتصفح الافتراضي...
start "" index.html

:end
