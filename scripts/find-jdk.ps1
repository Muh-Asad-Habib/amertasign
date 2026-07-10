$out = @()
$candidates = @(
  "C:\Program Files\Android\Android Studio\jbr",
  "C:\Program Files\Android\Android Studio\jre",
  "C:\Program Files\Java",
  "C:\Program Files\Eclipse Adoptium",
  "C:\Program Files\Microsoft"
)
foreach ($c in $candidates) {
  if (Test-Path $c) {
    $out += ("ADA: " + $c)
    if ($c -like "*jbr" -or $c -like "*jre") {
      $rel = Join-Path $c "release"
      if (Test-Path $rel) {
        $ver = (Get-Content $rel | Where-Object { $_ -match "JAVA_VERSION" }) -join ""
        $out += ("  " + $ver)
      }
    } else {
      Get-ChildItem $c -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $out += ("  sub: " + $_.FullName)
      }
    }
  } else {
    $out += ("tidak ada: " + $c)
  }
}
$out | Set-Content "D:\Coding\AmertaSign\AmertaSign-mobile\android\jdk-scan.txt" -Encoding UTF8

