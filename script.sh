#ffmpeg -i input.au out.flac
curl -X POST -u "apikey:SbF_X4RNAbPAD2If9es0u1TliJDjdKOS8Gd4l-sJEXfk" --header "Content-Type: audio/basic" --data-binary @input.au "https://gateway-lon.watsonplatform.net/speech-to-text/api/v1/recognize?model=en-US_NarrowbandModel"
