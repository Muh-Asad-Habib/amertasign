# Cek status build gradle: proses java, log, dan APK hasil.
$out = @()
$out += "=== WAKTU ==="
$out += (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

$out += "=== PROSES JAVA/GRADLE ==="
$procs = Get-Process -Name java -ErrorAction SilentlyContinue
if ($procs) {
  foreach ($p in $procs) { $out += ("java pid=" + $p.Id + " cpuSec=" + [int]$p.CPU + " memMB=" + [int]($p.WorkingSet64/1MB)) }
} else {
  $out += "tidak ada proses java"
}

$out += "=== LOG BUILD ==="
$log = "D:\Coding\AmertaSign\AmertaSign-mobile\android\build-log.txt"
if (Test-Path $log) {
  $item = Get-Item $log
  $out += ("ukuran=" + $item.Length + " bytes, update=" + $item.LastWriteTime)
  $out += "--- 10 baris terakhir ---"
  $out += (Get-Content $log -Tail 10)
} else {
  $out += "build-log.txt belum ada"
}

$out += "=== APK ==="
$apk = "D:\Coding\AmertaSign\AmertaSign-mobile\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
  $i = Get-Item $apk
  $out += ("APK ADA: " + [math]::Round($i.Length/1MB,1) + " MB, dibuat " + $i.LastWriteTime)
} else {
  $out += "APK belum ada"
}

$out | Set-Content "D:\Coding\AmertaSign\AmertaSign-mobile\android\build-status.txt" -Encoding UTF8

