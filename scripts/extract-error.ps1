# Ekstrak bagian error dari build-log.txt ke build-error.txt
$log = Get-Content "D:\Coding\AmertaSign\AmertaSign-mobile\android\build-log.txt"
$out = @()
$out += "TOTAL BARIS: " + $log.Count
$out += "=== BARIS DENGAN KATA KUNCI ERROR ==="
for ($i = 0; $i -lt $log.Count; $i++) {
  if ($log[$i] -match "CMake Error|error:|FAILED|What went wrong|Caused by|restricted method") {
    $start = [Math]::Max(0, $i - 2)
    $end = [Math]::Min($log.Count - 1, $i + 6)
    $out += ("--- konteks baris " + $i + " ---")
    $out += $log[$start..$end]
  }
}
$out | Select-Object -First 120 | Set-Content "D:\Coding\AmertaSign\AmertaSign-mobile\android\build-error.txt" -Encoding UTF8

