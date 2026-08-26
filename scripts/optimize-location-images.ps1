param(
  [string]$ArchivePath = (Join-Path $PSScriptRoot '..\FOTO-20260824T020446Z-1-001.zip'),
  [string]$OutputRoot = (Join-Path $PSScriptRoot '..\public\images\locations')
)

$ErrorActionPreference = 'Stop'

$photos = @(
  @{ Location = 'gerbang-pos'; Source = 'FOTO/Gerbang dan Pos Satpam/Gerbang dan Pos Satpam (1).jpg' },
  @{ Location = 'gerbang-pos'; Source = 'FOTO/Gerbang dan Pos Satpam/Gerbang dan Pos Satpam (2).jpg' },
  @{ Location = 'gerbang-pos'; Source = 'FOTO/Gerbang dan Pos Satpam/Gerbang dan Pos Satpam (3).jpg' },

  @{ Location = 'gedung-putih'; Source = 'FOTO/Gedung Putih/Gedung Putih (1).jpg' },
  @{ Location = 'gedung-putih'; Source = 'FOTO/Gedung Putih/Gedung Putih (2).jpg' },
  @{ Location = 'gedung-putih'; Source = 'FOTO/Gedung Putih/Gedung Putih (3).jpg' },
  @{ Location = 'gedung-putih'; Source = 'FOTO/Gedung Putih/IMG_20260822_134057.jpg' },
  @{ Location = 'gedung-putih'; Source = 'FOTO/Gedung Putih/IMG_20260822_134117.jpg' },
  @{ Location = 'gedung-putih'; Source = 'FOTO/Gedung Putih/IMG_20260822_134159.jpg' },

  @{ Location = 'technopark'; Source = 'FOTO/Technopark/IMG_20260822_134302.jpg' },
  @{ Location = 'technopark'; Source = 'FOTO/Technopark/IMG_20260822_134347.jpg' },
  @{ Location = 'technopark'; Source = 'FOTO/Technopark/IMG_20260822_134358.jpg' },
  @{ Location = 'technopark'; Source = 'FOTO/Technopark/Technopark (1).jpg' },

  @{ Location = 'gna-lobby'; Source = 'FOTO/Lobby/Lobby (1).jpg' },
  @{ Location = 'gna-lobby'; Source = 'FOTO/Lobby/Lobby (2).jpg' },
  @{ Location = 'gna-lobby'; Source = 'FOTO/TJKT/Teori TJKT/TJKT (1).jpg' },

  @{ Location = 'aula-te-samsung'; Source = 'FOTO/Aula/Aula (2).jpg' },
  @{ Location = 'aula-te-samsung'; Source = 'FOTO/Aula/Aula (3).jpeg' },
  @{ Location = 'aula-te-samsung'; Source = 'FOTO/TE + Samsung/Samsung (1).jpeg' },
  @{ Location = 'aula-te-samsung'; Source = 'FOTO/TE + Samsung/Samsung (2).jpeg' },
  @{ Location = 'aula-te-samsung'; Source = 'FOTO/TE + Samsung/Samsung (3).jpeg' },

  @{ Location = 'pplg'; Source = 'FOTO/PPLG/PPLG (1).jpg' },

  @{ Location = 'dpib-tkl-tkp'; Source = 'FOTO/DPIB/DPIB (1).jpg' },
  @{ Location = 'dpib-tkl-tkp'; Source = 'FOTO/DPIB/DPIB (2).jpeg' },
  @{ Location = 'dpib-tkl-tkp'; Source = 'FOTO/DPIB/DPIB (3).jpeg' },
  @{ Location = 'dpib-tkl-tkp'; Source = 'FOTO/TKL/TKL (1).jpeg' },
  @{ Location = 'dpib-tkl-tkp'; Source = 'FOTO/TKL/TKL (2).jpg' },

  @{ Location = 'masjid'; Source = 'FOTO/Masjid/IMG_20260822_131710.jpg' },
  @{ Location = 'masjid'; Source = 'FOTO/Masjid/IMG_20260822_131740.jpg' },
  @{ Location = 'masjid'; Source = 'FOTO/Masjid/IMG_20260822_133049.jpg' },
  @{ Location = 'masjid'; Source = 'FOTO/Masjid/IMG_20260822_133154.jpg' },
  @{ Location = 'masjid'; Source = 'FOTO/Masjid/IMG_20260822_133511.jpg' },
  @{ Location = 'masjid'; Source = 'FOTO/Masjid/Masjid (1).jpeg' },
  @{ Location = 'masjid'; Source = 'FOTO/Masjid/Masjid (2).jpg' },
  @{ Location = 'masjid'; Source = 'FOTO/Masjid/Masjid (5).jpeg' },

  @{ Location = 'uks'; Source = 'FOTO/Deretan UKS/Deretan UKS (1) Praktek TJKT.jpeg' },
  @{ Location = 'kantin-kopsis'; Source = 'FOTO/Koperasi Kantin/Koperasi Kantin (1).jpg' },

  @{ Location = 'lab-tjkt'; Source = 'FOTO/TJKT/Lab TJKT/Lab TJKT (1).jpeg' },
  @{ Location = 'lab-tjkt'; Source = 'FOTO/TJKT/Lab TJKT/Lab TJKT (2).jpeg' },
  @{ Location = 'lab-tjkt'; Source = 'FOTO/TJKT/Lab TJKT/Lab TJKT (3).jpeg' },
  @{ Location = 'lab-tjkt'; Source = 'FOTO/TJKT/Lab TJKT/Lab TJKT (4).jpeg' },

  @{ Location = 'um'; Source = 'FOTO/UM Mart/UM Mart (1).jpg' },
  @{ Location = 'bengkel-to-1'; Source = 'FOTO/TO/Bengkel 1 TO/Bengkel 1 TO (1).jpeg' },

  @{ Location = 'bengkel-to-2'; Source = 'FOTO/TO/Bengkel 2 TO/Bengkel 2 TO (1).jpg' },
  @{ Location = 'bengkel-to-2'; Source = 'FOTO/TO/Bengkel 2 TO/Bengkel 2 TO (2).jpg' },
  @{ Location = 'bengkel-to-2'; Source = 'FOTO/TO/Bengkel 2 TO/Bengkel 2 TO (3).jpg' },
  @{ Location = 'bengkel-to-2'; Source = 'FOTO/TO/Bengkel 2 TO/Bengkel 2 TO (5).jpg' },
  @{ Location = 'bengkel-to-2'; Source = 'FOTO/TO/Bengkel 2 TO/Bengkel 2 TO (7).jpeg' },

  @{ Location = 'teori-to'; Source = 'FOTO/TO/Teori TO/Teori TO (1).jpeg' },
  @{ Location = 'teori-to'; Source = 'FOTO/TO/Teori TO/Teori TO (2).jpeg' },
  @{ Location = 'bengkel-tm'; Source = 'FOTO/TM/TM (1).jpg' },

  @{ Location = 'lapvol'; Source = 'FOTO/Lapangan/Lapangan Voli (1).jpg' },
  @{ Location = 'lapvol'; Source = 'FOTO/Lapangan/Lapangan Voli (2).jpeg' },

  @{ Location = 'tpfl'; Source = 'FOTO/TPFL/TPFL (1).jpeg' },
  @{ Location = 'tpfl'; Source = 'FOTO/TPFL/TPFL (2).jpeg' },

  @{ Location = 'kamar-mandi-lab'; Source = 'FOTO/Kamar Mandi/Kamar Mandi (1).jpg' },
  @{ Location = 'kamar-mandi-lab'; Source = 'FOTO/Kamar Mandi/Kamar Mandi (2).jpg' },
  @{ Location = 'kamar-mandi-lab'; Source = 'FOTO/Kamar Mandi/Kamar Mandi (3).jpg' },
  @{ Location = 'kamar-mandi-lab'; Source = 'FOTO/Kamar Mandi/Kamar Mandi (4).jpg' },

  @{ Location = 'gedung-organisasi'; Source = 'FOTO/Gedung Organisasi/Gedung Organisasi (1).jpg' },
  @{ Location = 'gedung-organisasi'; Source = 'FOTO/Gedung Organisasi/Gedung Organisasi (2).jpg' },
  @{ Location = 'gedung-organisasi'; Source = 'FOTO/Gedung Organisasi/Gedung Organisasi (3).jpg' },
  @{ Location = 'gedung-organisasi'; Source = 'FOTO/Gedung Organisasi/Gedung Organisasi (4).jpg' },
  @{ Location = 'gedung-organisasi'; Source = 'FOTO/Gedung Organisasi/Gedung Organisasi (5).jpg' }
)

if (-not (Test-Path -LiteralPath $ArchivePath)) {
  throw "Archive foto tidak ditemukan: $ArchivePath"
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw 'ffmpeg tidak ditemukan di PATH.'
}

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) "virtual-tour-photos-$([guid]::NewGuid())"
New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

function Convert-Photo([string]$InputPath, [string]$OutputPath, [int]$MaxDimension, [int]$Quality) {
  $scale = "scale=w='if(gte(iw,ih),min(iw,$MaxDimension),-2)':h='if(lt(iw,ih),min(ih,$MaxDimension),-2)'"
  & ffmpeg -hide_banner -loglevel error -y -i $InputPath -map_metadata -1 -vf $scale -frames:v 1 -c:v libwebp -preset photo -quality $Quality -compression_level 4 $OutputPath
  if ($LASTEXITCODE -ne 0) { throw "Gagal mengoptimasi: $InputPath" }
}

try {
  Expand-Archive -LiteralPath $ArchivePath -DestinationPath $tempRoot
  $indexes = @{}

  foreach ($photo in $photos) {
    $location = $photo.Location
    $indexes[$location] = 1 + ($indexes[$location] ?? 0)
    $index = '{0:D2}' -f $indexes[$location]
    $source = Join-Path $tempRoot ($photo.Source -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $source)) { throw "Foto sumber tidak ditemukan: $($photo.Source)" }

    $locationOutput = Join-Path $OutputRoot $location
    New-Item -ItemType Directory -Path $locationOutput -Force | Out-Null
    Convert-Photo $source (Join-Path $locationOutput "$index.webp") 1600 80
    Convert-Photo $source (Join-Path $locationOutput "$index-thumb.webp") 480 76
  }

  $outputs = Get-ChildItem -LiteralPath $OutputRoot -Recurse -File -Filter '*.webp'
  $totalBytes = ($outputs | Measure-Object -Property Length -Sum).Sum
  [pscustomobject]@{
    SourcePhotos = $photos.Count
    OutputFiles = $outputs.Count
    OutputMiB = [math]::Round($totalBytes / 1MB, 2)
  }
}
finally {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
