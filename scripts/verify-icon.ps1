# Verifikasi bahwa icon.png berisi logo AMERTA (biru + emas), bukan default Expo.
Add-Type -AssemblyName System.Drawing

$path = "D:\Coding\AmertaSign\AmertaSign-mobile\assets\icon.png"
$img = [System.Drawing.Bitmap]::FromFile($path)

$blue = 0; $gold = 0; $white = 0; $other = 0; $total = 0
for ($y = 0; $y -lt $img.Height; $y += 16) {
  for ($x = 0; $x -lt $img.Width; $x += 16) {
    $p = $img.GetPixel($x, $y)
    if ($p.A -lt 100) { continue }
    $total++
    if ($p.R -gt 230 -and $p.G -gt 230 -and $p.B -gt 230) { $white++ }
    elseif ($p.B -gt 120 -and $p.B -gt ($p.R + 40) -and $p.G -lt 150) { $blue++ }
    elseif ($p.R -gt 180 -and $p.G -gt 120 -and $p.B -lt 100) { $gold++ }
    else { $other++ }
  }
}
$img.Dispose()

Write-Host ("Total sampel : {0}" -f $total)
Write-Host ("Putih        : {0}" -f $white)
Write-Host ("Biru (logo)  : {0}" -f $blue)
Write-Host ("Emas (wave)  : {0}" -f $gold)
Write-Host ("Lainnya      : {0}" -f $other)

if ($blue -gt 20 -and $gold -gt 3) {
  Write-Host "HASIL: icon.png BERISI logo AMERTA (biru + emas terdeteksi)."
} else {
  Write-Host "HASIL: icon.png TIDAK terdeteksi berisi logo AMERTA!"
}

