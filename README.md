# And Chess For All Website

Upload these files to the root of your GitHub repository.

## GitHub Pages
Settings → Pages → Deploy from a branch → main → /(root)

## Automatic club data
The included GitHub Action runs every 30 minutes and updates `data/club-data.json` from Chess.com PubAPI:
- club member count
- all public members
- rapid, blitz, and daily ratings
- public club match data

Chess.com PubAPI is read-only, so this site can display public data but cannot create posts, greetings, or events inside Chess.com.
