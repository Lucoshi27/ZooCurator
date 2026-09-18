# Zoo Curator ground-up v4

Run from this folder:

    python -m http.server 8000

Then open http://localhost:8000/

Keep the existing `assets` folder beside these files. Expected asset roots:

    assets/animals/carnivora/1/Back.png
    assets/animals/<category folder>/<level>/<animal>.png
    assets/enclosures/enclosure 1.png
    assets/enclosures/enclosure 2.png
    ...

The loading screen now reports every startup stage and every image path being checked. If JavaScript does not execute, the page reports that separately after 5 seconds. If an asset is missing, the exact path is shown in the fatal error screen.
