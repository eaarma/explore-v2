Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$script:FontCollections = New-Object System.Collections.Generic.List[System.Drawing.Text.PrivateFontCollection]
$script:FontFamiliesByPath = @{}

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$fontsDir = Join-Path $rootDir "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts"
$outputDir = Join-Path $rootDir "assets/map-markers"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
Get-ChildItem -Path $outputDir -Filter "*.png" -ErrorAction SilentlyContinue | Remove-Item -Force

$categoryConfigs = @(
  @{
    Name = "nature"
    FontFile = "MaterialCommunityIcons.ttf"
    Codepoint = 983850
    LocationFontSize = 35.1
    JourneyFontSize = 30.3
    LocationXOffset = 2
    JourneyXOffset = 2
    LocationYOffset = 1
    JourneyYOffset = 1
  },
  @{
    Name = "hiking"
    FontFile = "MaterialCommunityIcons.ttf"
    Codepoint = 986495
    LocationFontSize = 34.0
    JourneyFontSize = 29.5
    LocationXOffset = 0
    JourneyXOffset = 0
    LocationYOffset = 1
    JourneyYOffset = 1
  },
  @{
    Name = "camping"
    FontFile = "MaterialCommunityIcons.ttf"
    Codepoint = 984328
    LocationFontSize = 33.9
    JourneyFontSize = 29.0
    LocationXOffset = 0
    JourneyXOffset = 0
    LocationYOffset = -1
    JourneyYOffset = -1
  },
  @{
    Name = "sightseeing"
    FontFile = "FontAwesome6_Solid.ttf"
    Codepoint = 62886
    LocationFontSize = 30.3
    JourneyFontSize = 26.6
    LocationXOffset = 1
    JourneyXOffset = 1
    LocationYOffset = 0
    JourneyYOffset = 0
  },
  @{
    Name = "urbex"
    FontFile = "MaterialCommunityIcons.ttf"
    Codepoint = 983567
    LocationFontSize = 31.5
    JourneyFontSize = 27.8
    LocationXOffset = 0
    JourneyXOffset = 0
    LocationYOffset = 0
    JourneyYOffset = 0
  },
  @{
    Name = "adventure"
    FontFile = "MaterialCommunityIcons.ttf"
    Codepoint = 983435
    LocationFontSize = 32.7
    JourneyFontSize = 29.0
    LocationXOffset = 2
    JourneyXOffset = 2
    LocationYOffset = 2
    JourneyYOffset = 2
  }
)

$markerStatesByKind = @{
  location = @(
    @{
      Name = "default"
      Fill = "#2563eb"
      Stroke = "#ffffff"
    },
    @{
      Name = "achieved"
      Fill = "#22c55e"
      Stroke = "#e6efe4"
    },
    @{
      Name = "active"
      Fill = "#EAB308"
      Stroke = "#FEF3C7"
    }
  )
  journey = @(
    @{
      Name = "default"
      Fill = "#f97316"
      Stroke = "#fff7ed"
    },
    @{
      Name = "achieved"
      Fill = "#10b981"
      Stroke = "#e6efe4"
    },
    @{
      Name = "active"
      Fill = "#EAB308"
      Stroke = "#FEF3C7"
    }
  )
}

function Get-Color([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Get-FontFamily([string]$fontFileName) {
  $fontPath = (Resolve-Path (Join-Path $fontsDir $fontFileName)).Path

  if ($script:FontFamiliesByPath.ContainsKey($fontPath)) {
    return $script:FontFamiliesByPath[$fontPath]
  }

  $collection = New-Object System.Drawing.Text.PrivateFontCollection
  $collection.AddFontFile($fontPath)
  $script:FontCollections.Add($collection) | Out-Null
  $family = $collection.Families[0]
  $script:FontFamiliesByPath[$fontPath] = $family

  return $family
}

function New-Graphics([int]$size) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::Transparent)

  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Draw-LocationMarker(
  [string]$outputPath,
  [hashtable]$category,
  [hashtable]$state
) {
  $surface = New-Graphics 96
  $bitmap = $surface.Bitmap
  $graphics = $surface.Graphics

  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 15, 23, 42))
  $fillBrush = New-Object System.Drawing.SolidBrush (Get-Color $state.Fill)
  $strokePen = New-Object System.Drawing.Pen (Get-Color $state.Stroke), 6
  $iconBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $fontFamily = Get-FontFamily $category.FontFile
  $font = New-Object System.Drawing.Font(
    $fontFamily,
    $category.LocationFontSize,
    [System.Drawing.FontStyle]::Regular,
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  try {
    $graphics.FillEllipse($shadowBrush, 18, 20, 60, 60)
    $graphics.FillEllipse($fillBrush, 18, 18, 60, 60)
    $graphics.DrawEllipse($strokePen, 18, 18, 60, 60)

    $glyph = [System.Char]::ConvertFromUtf32([int]$category.Codepoint)
    $graphics.DrawString(
      $glyph,
      $font,
      $iconBrush,
      (New-Object System.Drawing.RectangleF -ArgumentList (18 + [single]$category.LocationXOffset), (18 + [single]$category.LocationYOffset), 60, 60),
      $format
    )

    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $shadowBrush.Dispose()
    $fillBrush.Dispose()
    $strokePen.Dispose()
    $iconBrush.Dispose()
    $font.Dispose()
    $format.Dispose()
  }
}

function Draw-JourneyMarker(
  [string]$outputPath,
  [hashtable]$category,
  [hashtable]$state
) {
  $surface = New-Graphics 96
  $bitmap = $surface.Bitmap
  $graphics = $surface.Graphics

  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(32, 15, 23, 42))
  $fillBrush = New-Object System.Drawing.SolidBrush (Get-Color $state.Fill)
  $strokePen = New-Object System.Drawing.Pen (Get-Color $state.Stroke), 6
  $iconBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $fontFamily = Get-FontFamily $category.FontFile
  $font = New-Object System.Drawing.Font(
    $fontFamily,
    $category.JourneyFontSize,
    [System.Drawing.FontStyle]::Regular,
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $shadowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diamondPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $shadowOffset = New-Object System.Drawing.Drawing2D.Matrix

  try {
    $shadowPath.AddPolygon(@(
      (New-Object System.Drawing.Point(48, 14)),
      (New-Object System.Drawing.Point(80, 46)),
      (New-Object System.Drawing.Point(48, 78)),
      (New-Object System.Drawing.Point(16, 46))
    ))
    $shadowOffset.Translate(0, 2)
    $shadowPath.Transform($shadowOffset)
    $graphics.FillPath($shadowBrush, $shadowPath)

    $diamondPath.AddPolygon(@(
      (New-Object System.Drawing.Point(48, 12)),
      (New-Object System.Drawing.Point(82, 46)),
      (New-Object System.Drawing.Point(48, 80)),
      (New-Object System.Drawing.Point(14, 46))
    ))
    $graphics.FillPath($fillBrush, $diamondPath)
    $graphics.DrawPath($strokePen, $diamondPath)

    $glyph = [System.Char]::ConvertFromUtf32([int]$category.Codepoint)
    $graphics.DrawString(
      $glyph,
      $font,
      $iconBrush,
      (New-Object System.Drawing.RectangleF -ArgumentList (18 + [single]$category.JourneyXOffset), (18 + [single]$category.JourneyYOffset), 60, 56),
      $format
    )

    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $shadowBrush.Dispose()
    $fillBrush.Dispose()
    $strokePen.Dispose()
    $iconBrush.Dispose()
    $font.Dispose()
    $format.Dispose()
    $shadowPath.Dispose()
    $diamondPath.Dispose()
    $shadowOffset.Dispose()
  }
}

foreach ($category in $categoryConfigs) {
  foreach ($state in $markerStatesByKind.location) {
    $filePath = Join-Path $outputDir ("location-{0}-{1}.png" -f $category.Name, $state.Name)
    Draw-LocationMarker -outputPath $filePath -category $category -state $state
  }

  foreach ($state in $markerStatesByKind.journey) {
    $filePath = Join-Path $outputDir ("journey-{0}-{1}.png" -f $category.Name, $state.Name)
    Draw-JourneyMarker -outputPath $filePath -category $category -state $state
  }
}

Write-Output ("Generated {0} marker assets in {1}" -f (($categoryConfigs.Count * 6)), $outputDir)
