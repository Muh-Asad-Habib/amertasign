$out = @()
$out += "=== JAVA_HOME ==="
$out += ("JAVA_HOME=" + $env:JAVA_HOME)
$out += "=== java -version ==="
$java = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin\java.exe" } else { "java" }
try { $out += (& $java -version 2>&1) } catch { $out += ("gagal: " + $_.Exception.Message) }
$out | Set-Content "D:\Coding\AmertaSign\AmertaSign-mobile\android\java-version.txt" -Encoding UTF8

