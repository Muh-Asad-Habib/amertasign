# Membuat ulang ikon aplikasi dari logo resmi AMERTA.
# Sumber: assets/TR AMERTA (Logo).png (transparan, resolusi tinggi).
# Hasil: icon.png (1024, latar putih), adaptive-icon.png (1024, transparan),
#        favicon.png (196, transparan), splash-icon.png (1024, transparan).
# Ikon lama dicadangkan ke assets/backup-expo-default/.

Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot "..\assets" | Resolve-Path
$backup = Join-Path $assets "backup-expo-default"
New-Item -ItemType Directory -Force -Path $backup | Out-Null

foreach ($f in "icon.png", "adaptive-icon.png", "favicon.png", "splash-icon.png") {
  $p = Join-Path $assets $f
  if (Test-Path $p) { Copy-Item $p (Join-Path $backup $f) -Force }
}

$srcPath = Join-Path $assets "TR AMERTA (Logo).png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# --- Cari bounding box logo (pindai versi kecil 256px agar cepat) ---
$scanSize = 256
$scan = New-Object System.Drawing.Bitmap($scanSize, $scanSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($scan)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($src, 0, 0, $scanSize, $scanSize)
$g.Dispose()

$minX = $scanSize; $minY = $scanSize; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $scanSize; $y++) {
  for ($x = 0; $x -lt $scanSize; $x++) {
    if ($scan.GetPixel($x, $y).A -gt 16) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$scan.Dispose()

if ($maxX -lt 0) { throw "Logo tidak terdeteksi (semua piksel transparan?)" }

$fx = $src.Width / [double]$scanSize
$fy = $src.Height / [double]$scanSize
$bx = [int][Math]::Floor($minX * $fx)
$by = [int][Math]::Floor($minY * $fy)
$bw = [int][Math]::Ceiling(($maxX - $minX + 1) * $fx)
$bh = [int][Math]::Ceiling(($maxY - $minY + 1) * $fy)
if ($bx + $bw -gt $src.Width) { $bw = $src.Width - $bx }
if ($by + $bh -gt $src.Height) { $bh = $src.Height - $by }
Write-Host ("Bounding box logo: {0},{1} {2}x{3}" -f $bx, $by, $bw, $bh)

function New-Icon {
  param(
    [int]$Canvas,
    [double]$Scale,
    [System.Drawing.Color]$Bg,
    [string]$OutPath
  )
  $bmp = New-Object System.Drawing.Bitmap($Canvas, $Canvas, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gr = [System.Drawing.Graphics]::FromImage($bmp)
  $gr.SmoothingMode = 'HighQuality'
  $gr.InterpolationMode = 'HighQualityBicubic'
  $gr.PixelOffsetMode = 'HighQuality'
  if ($Bg.A -gt 0) { $gr.Clear($Bg) }

  $target = $Canvas * $Scale
  $ratio = [Math]::Min($target / $bw, $target / $bh)
  $w = [int]($bw * $ratio); $h = [int]($bh * $ratio)
  $x = [int](($Canvas - $w) / 2); $y = [int](($Canvas - $h) / 2)

  $destRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $srcRect = New-Object System.Drawing.Rectangle($bx, $by, $bw, $bh)
  $gr.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $gr.Dispose()

  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "OK: $OutPath"
}

$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)

# Ikon utama (iOS/umum): wajib tanpa transparansi -> latar putih.
New-Icon -Canvas 1024 -Scale 0.74 -Bg ([System.Drawing.Color]::White) -OutPath (Join-Path $assets "icon.png")
# Adaptive icon Android (foreground): transparan, logo dalam zona aman.
New-Icon -Canvas 1024 -Scale 0.58 -Bg $transparent -OutPath (Join-Path $assets "adaptive-icon.png")
# Favicon web.
New-Icon -Canvas 196 -Scale 0.9 -Bg $transparent -OutPath (Join-Path $assets "favicon.png")
# Ikon splash.
New-Icon -Canvas 1024 -Scale 0.62 -Bg $transparent -OutPath (Join-Path $assets "splash-icon.png")

$src.Dispose()
Write-Host "SELESAI - ikon dibuat dari logo resmi."

