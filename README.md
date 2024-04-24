## Usage

```bash
npm install
```

```bash
npm run dev
```

or

```bash
npm run build
```

## TODO

- [ ] Add option for derivative
- [x] Add upvote percentage data
- [x] Add filter for user
    - [x] Multiple users filter
- [ ] Ability to see post ID and maybe click to open reddit link
- [x] Add "time since posted"/"age" of post in tooltip
- [ ] Better hover on start dots
    - ~~hoverradius and hitradius~~
        - Seems hard to fix
- [x] Add r/all placement
- [x] Add dots for when comic was posted
- [x] Start at ~~24h~~ 48h
- [ ] Fix CSS
- [ ] Improve performance
    - [ ] Zooming is really slow
    - [ ] Maybe scrap points that are like more than 5 days outside current window
    - [x] Always sort current data points (sorted dict) to speed up baking in fpRank
        - [x] Fixed loading data slowly
- [ ] Add communities ranking and subscribers compared to other communities
- [ ] Figure out how often to run fetching
    - Currently changed it from 2 minutes to 4 minutes... This is bad for realtime but is good for data management. I.e. not too much data => less lag.
    - Best would be nice to always keep last row as "active" row that is updated every minute. That way users can always be up to date, but the row should be overwritten until it's gap to the second to last row is ~5 minutes.
    - This row could be labeled "ACTIVE" and other rows could be labeled based "minute" or "hour" or "day"(?). That way, we can make quantization more consistent.
