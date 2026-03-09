export const todayData = {
  holidayDelay: 'No delay',
  recycling: 'Cardboard',
  parking: 'Even side today',
  alerts: 'No active alerts',
  updatedAt: 'Updated today · 6:00 AM · All systems normal',
};

export const weatherData = {
  temp: '42°',
  condition: 'Light Snow',
  high: '45°',
  low: '31°',
  precip: '60%',
  wind: '12 mph',
  localNote: 'Snow possible tonight — check parking rules',
};

export const recyclingData = {
  thisWeek: {
    label: 'This Week',
    items: ['Cardboard', 'Paper'],
    dateRange: 'Mar 10 – 14',
  },
  nextWeek: {
    label: 'Next Week',
    items: ['Plastic', 'Cans', 'Glass'],
    dateRange: 'Mar 17 – 21',
  },
  holidayRule: 'If your pickup falls on a holiday, recycling moves to Saturday.',
  rotation: ['Week A: Cardboard & Paper', 'Week B: Plastic, Cans & Glass'],
};

export const parkingData = {
  today: {
    date: 'Mar 9',
    day: 'Sunday',
    side: 'ODD',
    rule: 'Park on the odd side on odd-numbered dates',
  },
  season: 'Winter rules active',
  switchTime: 'Side switches at midnight each day',
  schedule: [
    { date: 'Mar 8', day: 'Sat', side: 'EVEN' },
    { date: 'Mar 9', day: 'Sun', side: 'ODD' },
    { date: 'Mar 10', day: 'Mon', side: 'EVEN' },
    { date: 'Mar 11', day: 'Tue', side: 'ODD' },
    { date: 'Mar 12', day: 'Wed', side: 'EVEN' },
    { date: 'Mar 13', day: 'Thu', side: 'ODD' },
    { date: 'Mar 14', day: 'Fri', side: 'EVEN' },
  ],
  exceptions: 'Snow emergency routes override alternate-side rules. Check alerts.',
};

export const alertsData = {
  status: 'clear',
  message: 'No active alerts for Jamestown.',
  updates: [
    {
      id: '1',
      severity: 'info',
      title: 'Recycling pickup delayed last week',
      body: 'Pickup resumed Thursday due to equipment maintenance.',
      date: 'Mar 6',
    },
    {
      id: '2',
      severity: 'caution',
      title: 'Winter parking rules in effect',
      body: 'Alternate-side parking remains active. Check daily.',
      date: 'Feb 15',
    },
  ],
};

export const eventsData = [
  {
    id: '1',
    title: 'City Council Meeting',
    date: 'Mar 11',
    time: '7:00 PM',
    location: 'City Hall',
    tags: ['Civic', 'Government'],
  },
  {
    id: '2',
    title: 'Spring Cleanup Registration Opens',
    date: 'Mar 15',
    time: '8:00 AM',
    location: 'Online',
    tags: ['BPU', 'Registration'],
  },
  {
    id: '3',
    title: 'Chautauqua County Job Fair',
    date: 'Mar 20',
    time: '10:00 AM – 2:00 PM',
    location: 'Northwest Arena',
    tags: ['Community'],
  },
  {
    id: '4',
    title: 'Board of Public Utilities Meeting',
    date: 'Mar 25',
    time: '5:30 PM',
    location: 'BPU Offices',
    tags: ['BPU', 'Civic'],
  },
  {
    id: '5',
    title: 'Earth Day Volunteer Cleanup',
    date: 'Apr 22',
    time: '9:00 AM',
    location: 'Chadakoin River Park',
    tags: ['Community', 'Environment'],
  },
];
