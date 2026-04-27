const axios = require('axios');
const { faker } = require('@faker-js/faker');

async function seedCleaners() {
  const titles = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'];
  const programs = ['Postgraduate', 'ODL', 'Upgrading'];

  for (let i = 0; i < 100; i++) {
    const form = {
      firstname: faker.person.firstName(),
      middlename: faker.person.middleName(),
      lastname: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number('+265 9## ### ###'),
      dob: faker.date.birthdate({ min: 20, max: 40, mode: 'age' }).toISOString().split('T')[0],
      title: faker.helpers.arrayElement(titles),
      program: faker.helpers.arrayElement(programs),
      password: 'Password123!', // fixed password for simplicity
      role: 'Cleaner',
    };

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/apply', form, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log(`✅ User ${i + 1} created: ${form.email}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${i + 1}:`, error.response?.data || error.message);
    }
  }
}

seedCleaners();
