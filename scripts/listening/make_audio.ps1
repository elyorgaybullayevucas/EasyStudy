# Listening transkriptidan WAV audio yaratadi (Windows TTS, ovozlar: David/Zira).
# Satr prefikslari: N: diktor, R: resepshn (ayol), D: Daniel (erkak), Z: kutubxonachi (ayol), E: Emma (ayol), J: Jack (erkak), T: tutor (ayol), L: ma'ruzachi (erkak, sekin), P: pauza.
# Foydalanish: powershell -ExecutionPolicy Bypass -File make_audio.ps1 -In ielts-mock1.txt -Out ielts-mock1.wav
param(
  [string]$In = "ielts-mock1.txt",
  [string]$Out = "ielts-mock1.wav"
)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$synth.SetOutputToWaveFile($Out, $fmt)
$synth.Rate = -1
$male = ($synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq "Male" } | Select-Object -First 1).VoiceInfo.Name
$female = ($synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq "Female" } | Select-Object -First 1).VoiceInfo.Name
Get-Content -Encoding UTF8 $In | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "") { return }
  $tag = $line.Substring(0, 2)
  $text = $line.Substring(2).Trim()
  switch ($tag) {
    "P:" { $b = New-Object System.Speech.Synthesis.PromptBuilder; $b.AppendBreak([TimeSpan]::FromSeconds(12)); $synth.Speak($b); return }
    "N:" { $synth.SelectVoice($female); $synth.Rate = -2 }
    "R:" { $synth.SelectVoice($female); $synth.Rate = -1 }
    "Z:" { $synth.SelectVoice($female); $synth.Rate = -1 }
    "D:" { $synth.SelectVoice($male); $synth.Rate = -1 }
    "E:" { $synth.SelectVoice($female); $synth.Rate = 0 }
    "J:" { $synth.SelectVoice($male); $synth.Rate = 0 }
    "T:" { $synth.SelectVoice($female); $synth.Rate = -1 }
    "L:" { $synth.SelectVoice($male); $synth.Rate = -2 }
    default { $synth.SelectVoice($female) }
  }
  $synth.Speak($text)
  $p = New-Object System.Speech.Synthesis.PromptBuilder; $p.AppendBreak([TimeSpan]::FromMilliseconds(700)); $synth.Speak($p)
}
$synth.Dispose()
Write-Host "Yozildi: $Out"
