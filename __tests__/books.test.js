process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

let testBook;

beforeEach(async () => {
  let result = await db.query(
    `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) VALUES ('8419187940', 'https:/www.amazon.com', 'John Doe', 'English', 100, 'Some publisher', 'Test Book', 2000) RETURNING isbn`
  );
  testBook = result.rows[0].isbn;
});

// POST /books => {book: newBook}
describe('POST / books', () => {
  // Post a new book
  test('creates a new book', async () => {
    const response = await request(app).post('/books').send({
      isbn: '910584209',
      amazon_url: 'https://www.amazon.com/book1',
      author: 'Joe Smith',
      language: 'English',
      pages: 100,
      publisher: 'Publisher company one',
      title: 'Posted Test Book 1',
      year: 2010,
    });
    // Check db to see if posted book has right data and response code.
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty('isbn');
  });
  // Post a new book with invalid data
  test('returns a 400 error if the book is invalid', async () => {
    const response = await request(app).post('/books').send({
      isbn: '910584209',
      amazon_url: 'https://www.amazon.com/book1',
    });
    // Make sure we are getting a 400 error for invalid book data
    expect(response.statusCode).toBe(400);
  });
});

// Test GET /books route and that we do not return an empty db of books
describe('GET / books', () => {
  test('returns all books', async () => {
    const response = await request(app).get('/books');
    expect(response.statusCode).toBe(200);
    expect(response.body.books).toHaveLength(1);
  });
});

// Test get a book by isbn
describe('GET / books/:isbn', () => {
  test('returns a single book', async () => {
    const response = await request(app).get(`/books/${testBook}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.book).toHaveProperty('isbn');
    expect(response.body.book.isbn).toBe(testBook);
  });
  test('returns a 404 error if the book is not found', async () => {
    const response = await request(app).get(`/books/12345`);
    expect(response.statusCode).toBe(404);
  });
});

// Test PUT /books/:isbn
describe('PUT / books/:910584209', () => {
  test('updates a book', async () => {
    const response = await request(app).put(`/books/${testBook}`).send({
      author: 'Joe Smith',
      language: 'English',
      pages: 1000,
      title: 'Updated Test Book 2',
      year: 2022,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.book).toHaveProperty('isbn');
    expect(response.body.book.isbn).toBe(testBook);
  });
});

describe('DELETE / books/:isbn', () => {
  test('deletes a book', async () => {
    const response = await request(app).delete(`/books/${testBook}`);
    // Check to see if the book is deleted by status code and json message.
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Book deleted');
  });
});

afterEach(async function () {
  await db.query('DELETE FROM BOOKS');
});

afterAll(async function () {
  await db.end();
});
