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
    - hoverradius and hitradius:
```
var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['January', 'February', 'March', 'April'],
        datasets: [{
            label: 'Demo Data',
            data: [10, 20, 30, 40],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            pointHitRadius: 10, // Increases hit radius
            pointHoverRadius: 7 // Increases hover radius
        }]
    },
    options: {
        tooltips: {
            mode: 'nearest'
        }
    }
});
```
- [x] Add r/all placement
- [x] Add dots for when comic was posted
- [x] Start at ~~24h~~ 48h
- [ ] Fix CSS
- [ ] Improve performance
    - [ ] Zooming is really slow
    - [ ] Maybe scrap points that are like more than 5 days outside current window
    - [x] Always sort current data points (sorted dict) to speed up baking in fpRank
        - [x] Fixed loading data slowly
