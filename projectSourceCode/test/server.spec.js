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
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************