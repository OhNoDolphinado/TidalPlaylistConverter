// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  // Positive Test Case: Register API
  // API: /register
  // Input: {name: 'John Doe', email: 'john.doe@example.com', password: 'password123'}
  // Expect: res.status == 201 and res.body.message == 'User registered successfully'
  // Result: This test case should pass and return a status 201 along with a "User registered successfully" message.
  it('positive : /register', done => {
    const timestamp = Date.now();
    chai
      .request(server)
      .post('/register')
      .send({name: 'John Doe', email: `john.doe.${timestamp}@example.com`, password: 'password123'})
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body.message).to.equals('User registered successfully');
        done();
      });
  });

  // Negative Test Case: Register API with invalid input
  // API: /register
  // Input: {name: '', email: 'invalid-email', password: '123'}
  // Expect: res.status == 400 and res.body.error includes validation error
  // Result: This test case should pass and return a status 400 with an error message.
  it('negative : /register. Checking invalid input', done => {
    chai
      .request(server)
      .post('/register')
      .send({name: '', email: 'invalid-email', password: '123'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.error).to.equals('Name, email, and password are required');
        done();
      });
  });

  // Positive Test Case: Login API
  // API: /api/auth/login
  // Input: Valid email and password for existing user
  // Expect: res.status == 200 and res.body.message == 'Login successful'
  // Result: This test case should pass after registering a user first.
  it('positive : /api/auth/login', done => {
    // First register a user
    const timestamp = Date.now();
    const testEmail = `login.test.${timestamp}@example.com`;
    const testPassword = 'testpass123';

    chai
      .request(server)
      .post('/register')
      .send({name: 'Login Test User', email: testEmail, password: testPassword})
      .end((err, res) => {
        expect(res).to.have.status(201);

        // Now test login
        chai
          .request(server)
          .post('/api/auth/login')
          .send({email: testEmail, password: testPassword})
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.message).to.equals('Login successful');
            done();
          });
      });
  });

  // Negative Test Case: Login API with wrong password
  // API: /api/auth/login
  // Input: Valid email but wrong password
  // Expect: res.status == 401 and error message
  // Result: This test case should pass and return a status 401.
  it('negative : /api/auth/login. Wrong password', done => {
    const timestamp = Date.now();
    const testEmail = `login.test2.${timestamp}@example.com`;

    // First register a user
    chai
      .request(server)
      .post('/register')
      .send({name: 'Login Test User 2', email: testEmail, password: 'correctpass'})
      .end((err, res) => {
        expect(res).to.have.status(201);

        // Now test login with wrong password
        chai
          .request(server)
          .post('/api/auth/login')
          .send({email: testEmail, password: 'wrongpass'})
          .end((err, res) => {
            expect(res).to.have.status(401);
            expect(res.body.error).to.equals('Invalid email or password');
            done();
          });
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************