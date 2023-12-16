var spreadsheetID = '1ejkbveN8ByG3Bk7lKAmiQ4rTMQ922QjbzhJ8g0cWhfY'
var tabName = 'Sheet1'
var apiKey = process.env.API_KEY //FIX THIS TO BE SAFE!!!
var url =
  'https://sheets.googleapis.com/v4/spreadsheets/' +
  spreadsheetID +
  '/values/' +
  tabName +
  '?alt=json&key=' +
  apiKey

const request = new XMLHttpRequest()
request.open('GET', url, true)
request.send()
let requestCounter = 10

request.onload = function () {
  // REINSTATE FOR FINAL PROJECT
  console.log('HELLO')
  if (this.readyState === 4 && this.status === 200) {
    var googleSheetsJSON = JSON.parse(this.responseText)
    handleLoad(googleSheetsJSON)
  } else {
    requestCounter = requestCounter - 1
    console.log('Failed To Connect: ' + requestCounter)
    if (requestCounter >= 0) {
      request.open('GET', url, true)
      request.send()
    } else {
      console.log('Connection Failed')
    }
  }
}

function handleLoad(json) {
  json.values.shift()
  console.log(json)
  updatePage(json.values)
}

function updatePage(jsonEvents) {
  // GENERATE EVENT SCHEMA FOR GOOGLE:
  const eventScheduledScript = document.createElement('script')
  eventScheduledScript.setAttribute('type', 'application/ld+json')

  const allEvents = []
  const latestEvents = document.getElementById('events')
  latestEvents.textContent = ''

  jsonEvents.forEach((event) => {
    const EventObject = convertToEventObject(event)
    allEvents.push(EventObject)
  })
  console.log('Event Object: ', allEvents)

  const limitedEvents = getFirstPastToday(allEvents, 2)

  var allEventSchema = []

  limitedEvents.forEach((event) => {
    const eventCard = createEventCard(event)
    latestEvents.appendChild(eventCard)

    const eventSchema = createEventSchema(event)
    allEventSchema.push(eventSchema)
  })

  eventScheduledScript.innerHTML = JSON.stringify(allEventSchema)
  document.head.appendChild(eventScheduledScript)
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

  const eventDate = document.createElement('div')
  const eventTime = document.createElement('div')
  const eventName = document.createElement('div')

  eventCard.className = 'event'
  eventDate.className = 'eventDate'
  eventTime.className = 'eventTime'
  eventName.className = 'eventName'

  eventDate.innerHTML = formatDate(event['date'])
  eventCard.appendChild(eventDate)

  eventTime.innerHTML = event['time']
  eventCard.appendChild(eventTime)

  eventName.innerHTML = event['performer']
  eventCard.appendChild(eventName)
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
    endDate: '',
    performer: {
      '@type': 'Organization',
      name: 'The Eastside Rhythm Kings',
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

  console.log('dateParts', dateParts)
  console.log('time', time)

  // Construct the new date string
  var newDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0])
  console.log('newDate', newDate)
  var newDateString = newDate.toISOString().split('T')[0]
  console.log('newDateString', newDateString)

  // Return the new date and time string
  return newDateString + 'T' + timePart
}

function getFirstPastToday(arr, limit) {
  // Get today's date
  let today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter the array for dates past today
  let filteredArr = arr.filter((item) => {
    let itemDate = new Date(item['date'])
    return itemDate > today
  })

  // Return the first two elements
  return filteredArr.slice(0, limit)
}
