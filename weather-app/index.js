const express = require('express')
const axios = require('axios')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000
const OPENWEATHERMAP_API_KEY = '5eb918c73eee28eb41096c2ebb78aa2c'

let searchHistory = []

app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.send(`
        <html>
            <head>
                <title>Weather App</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <div class="container">
                    <h1>Weather App</h1>
                    <form action="/weather" method="post">
                        <label for="city">Enter city name:</label>
                        <input type="text" id="city" name="city" required>
                        <button type="submit">Get Weather</button>
                    </form>
                    <h2>Recent Searches</h2>
                    <ul class="history">
                        ${searchHistory
                          .map(item => `<li>${item}</li>`)
                          .join('')}
                    </ul>
                </div>
            </body>
        </html>
    `)
})

app.post('/weather', async (req, res) => {
  const city = req.body.city
  try {
    // Get current weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
    const weatherResponse = await axios.get(weatherUrl)
    const weatherData = weatherResponse.data

    // Get 5-day forecast data
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
    const forecastResponse = await axios.get(forecastUrl)
    const forecastData = forecastResponse.data

    // Generate map URL
    const mapUrl = `https://tile.openweathermap.org/map/precipitation/10/1/1.png?appid=${OPENWEATHERMAP_API_KEY}`

    // Update search history
    if (!searchHistory.includes(city)) {
      searchHistory.unshift(city)
      if (searchHistory.length > 5) searchHistory.pop()
    }

    const currentDate = new Date(weatherData.dt * 1000).toLocaleString()

    const weatherInfo = `
            <html>
                <head>
                    <title>Weather in ${weatherData.name}</title>
                    <link rel="stylesheet" href="/styles.css">
                </head>
                <body>
                    <div class="container">
                        <h1>Weather in ${weatherData.name}</h1>
                        <p><strong>Date and Time:</strong> ${currentDate}</p>
                        <p><strong>Temperature:</strong> ${
                          weatherData.main.temp
                        }°C</p>
                        <p><strong>Feels Like:</strong> ${
                          weatherData.main.feels_like
                        }°C</p>
                        <p><strong>Weather Description:</strong> ${weatherData.weather
                          .map(w => w.description)
                          .join(', ')}</p>
                        <img src="http://openweathermap.org/img/wn/${
                          weatherData.weather[0].icon
                        }.png" alt="${weatherData.weather[0].description}">
                        <p><strong>Humidity:</strong> ${
                          weatherData.main.humidity
                        }%</p>
                        <p><strong>Wind Speed:</strong> ${
                          weatherData.wind.speed
                        } m/s</p>
                        <p><strong>Visibility:</strong> ${
                          weatherData.visibility
                        } meters</p>
                        <p><strong>Sunrise:</strong> ${new Date(
                          weatherData.sys.sunrise * 1000,
                        ).toLocaleTimeString()}</p>
                        <p><strong>Sunset:</strong> ${new Date(
                          weatherData.sys.sunset * 1000,
                        ).toLocaleTimeString()}</p>

                        <h2>5-Day Forecast</h2>
                        <div class="forecast">
                            ${forecastData.list
                              .filter(item => item.dt_txt.includes('12:00:00'))
                              .map(
                                item => `
                                <div class="forecast-day">
                                    <h3>${new Date(
                                      item.dt * 1000,
                                    ).toLocaleDateString()}</h3>
                                    <p><strong>Temperature:</strong> ${
                                      item.main.temp
                                    }°C</p>
                                    <p><strong>Weather:</strong> ${item.weather
                                      .map(w => w.description)
                                      .join(', ')}</p>
                                    <img src="http://openweathermap.org/img/wn/${
                                      item.weather[0].icon
                                    }.png" alt="${item.weather[0].description}">
                                </div>
                            `,
                              )
                              .join('')}
                        </div>

                        <h2>Weather Map</h2>
                        

                        <a href="/">Check another city</a>
                    </div>
                </body>
            </html>
        `
    res.send(weatherInfo)
  } catch (error) {
    res.send(`<p>Error fetching weather data: ${error.message}</p>`)
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
