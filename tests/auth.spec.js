const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const { sequelize } = require('../models');

chai.use(chaiHttp);
const { expect } = chai;

describe('Auth API', () => {
  before(async () => {
    await sequelize.sync({ force: true });
  });

  describe('POST /auth/register', () => {
    it('should register a user successfully with a default organisation', (done) => {
      chai.request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phone: '1234567890'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('status', 'success');
          expect(res.body.data).to.have.property('accessToken');
          expect(res.body.data.user).to.include({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          });
          done();
        });
    });
  });

  describe('POST /auth/login', () => {
    it('should log the user in successfully', (done) => {
      chai.request(app)
        .post('/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('status', 'success');
          expect(res.body.data).to.have.property('accessToken');
          expect(res.body.data.user).to.include({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          });
          done();
        });
    });
  });
});
