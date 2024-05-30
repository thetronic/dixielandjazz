// Variables for accessing Google Sheets API
var spreadsheetID = '1ejkbveN8ByG3Bk7lKAmiQ4rTMQ922QjbzhJ8g0cWhfY'
var tabName = 'Sheet1'
var apiKey = 'AIzaSyBny4imxdqvCz-D4RwDy_Ruk2ENPUK_2CQ'

// Construct the URL for fetching sheet data
var url =
  'https://sheets.googleapis.com/v4/spreadsheets/' +
  spreadsheetID +
  '/values/' +
  tabName +
  '?alt=json&key=' +
  apiKey

// Initiate a asynchronous GET request to the specified URL
const request = new XMLHttpRequest()
request.open('GET', url, true)
request.send()
let requestCounter = 10 // Counter for retries

request.onload = function () {
  if (this.readyState === 4 && this.status === 200) {
    // Request successful, parse JSON response and handle data
    var googleSheetsJSON = JSON.parse(this.responseText)
    handleLoad(googleSheetsJSON)
  } else {
    // Request failed, retry up to 10 times
    requestCounter = requestCounter - 1

    if (requestCounter >= 0) {
      request.open('GET', url, true)
      request.send()
    } else {
      console.error('Connection Failed')
      handleLoad(null)
    }
  }
}

function handleLoad(json) {
  if (json) {
    json.values.shift()
    updatePage(json.values)
  } else {
    updatePage(null)
  }
}

function updatePage(jsonEvents) {
  // GENERATE EVENT SCHEMA FOR GOOGLE:
  if (jsonEvents) {
    const eventScheduledScript = document.createElement('script')
    eventScheduledScript.setAttribute('type', 'application/ld+json')

    const allEvents = []
    const latestEvents = document.getElementById('events')
    latestEvents.textContent = ''

    jsonEvents.forEach((event) => {
      const EventObject = convertToEventObject(event)
      allEvents.push(EventObject)
    })

    const limitedEvents = getFirstPastToday(allEvents, 1)

    var allEventSchema = []

    const event = limitedEvents[0]
    const eventCard = createEventCard(event)
    latestEvents.appendChild(eventCard)
    const eventSchema = createEventSchema(event)
    allEventSchema.push(eventSchema)

    eventScheduledScript.innerHTML = JSON.stringify(allEventSchema)
    document.head.appendChild(eventScheduledScript)
  } else {
    const latestEvents = document.getElementById('events')
    const noEvent = {
      name: '',
      date: '',
      time: '',
      description: '',
      performer: 'NO UPCOMING SHOWS',
    }
    const eventCard = createEventCard(noEvent)
    latestEvents.textContent = ''
    latestEvents.appendChild(eventCard)
  }
}

function convertToEventObject(event) {
  const EventObject = {}
  EventObject['date'] = event[0]
  EventObject['time'] = event[1]
  EventObject['name'] = event[2]
  EventObject['description'] = event[3]
  EventObject['performer'] = event[4]
  return EventObject
}

function createEventCard(event) {
  const eventCard = document.createElement('div')

  const eventName = document.createElement('div')
  const eventDate = document.createElement('div')
  const eventTime = document.createElement('div')

  eventCard.className = 'event'
  eventName.className = 'eventName'
  eventDate.className = 'eventDate'
  eventTime.className = 'eventTime'

  if (event['performer']) {
    eventName.innerHTML = '<b>' + event['performer'].toUpperCase() + '</b>'
    eventCard.appendChild(eventName)
  }

  if (event['date']) {
    eventDate.innerHTML = formatDate(event['date'])
    eventCard.appendChild(eventDate)
  }

  if (event['time']) {
    eventTime.innerHTML = event['time']
    eventCard.appendChild(eventTime)
  }

  return eventCard
}

function createEventSchema(event) {
  const eventSchema = {
    '@context': 'http://schema.org',
    '@type': 'Event',
    name: event['name'],
    url: 'http://www.dixieland.co.uk',
    image: 'http://www.dixieland.co.uk/images/esrk.jpg',
    description: event['description'],
    startDate: convertDateTime(event['time'], event['date']),
    endDate: convertDateTime('22:30', event['date']),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    performer: {
      '@type': 'Organization',
      name: event['name'],
      url: 'http://www.dixieland.co.uk',
    },
    location: {
      '@type': 'Place',
      name: 'Gladiator Club',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '263 Iffley Road',
        addressLocality: 'Oxford',
        addressRegion: 'Oxfordshire',
        postalCode: 'OX41SJ',
        addressCountry: 'UK',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event['name'],
      url: 'http://www.dixieland.co.uk',
    },
  }

  return eventSchema
}

function formatDate(input) {
  // Split the input into day, month, and year
  var parts = input.split('/')
  var day = parseInt(parts[0], 10)
  var month = parseInt(parts[1], 10) - 1 // months are 0-indexed in JavaScript
  var year = parseInt(parts[2], 10)

  // Create a new Date object
  var date = new Date(year, month, day)

  // Define arrays for the ordinal indicators and month names
  var monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  // Determine the correct ordinal indicator
  var j = day % 10,
    k = day % 100
  var ordinalIndicator =
    j === 1 && k !== 11
      ? 'st'
      : j === 2 && k !== 12
      ? 'nd'
      : j === 3 && k !== 13
      ? 'rd'
      : 'th'

  // Format the date
  var formattedDate =
    day +
    ordinalIndicator +
    ' ' +
    monthNames[date.getMonth()] +
    ' ' +
    date.getFullYear()

  return formattedDate
}

function convertDateTime(time, date) {
  // Split the input into date and time
  var dateParts = date.split('/')
  var timePart = time

  // Construct the new date string
  var newDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0])
  var newDateString = newDate.toISOString().split('T')[0]

  // Return the new date and time string
  return newDateString + 'T' + timePart
}

function getFirstPastToday(arr, limit) {
  // Get today's date
  let today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter the array for dates past today
  let filteredArr = arr.filter((item) => {
    const dateString = item['date']
    var dateParts = dateString.split('/')
    // month is 0-based, that's why we need dataParts[1] - 1
    var itemDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0])
    return itemDate > today
  })

  // Return the first two elements
  return filteredArr.slice(0, limit)
}
