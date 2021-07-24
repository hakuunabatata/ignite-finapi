const { response } = require("express");
const express = require("express");
const { v4: uuid } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

const verifyIfExistAccountCPF = (req, res, next) => {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) return res.status(400).json({ error: "Customer not found!" });

  req.customer = customer;

  return next();
};

const getBalance = (statement) => {
  return statement.reduce((all, cur) => {
    const { type, amount } = cur;
    if (type === "credit") {
      return all + amount;
    } else if (type === "debit") {
      return all - amount;
    }
  }, 0);
};

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists)
    return res.status(400).json({ error: "Customer Already Exists" });

  customers.push({ cpf, name, id: uuid(), statement: [] });

  return res.status(201).send();
});

app.get("/statement", verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.post("/deposit", verifyIfExistAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  customer.statement.push({
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  });

  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount)
    return res.status(400).json({ error: "No Money for this transaction" });

  customer.statement.push({
    description: "withdraw",
    amount,
    createdAt: new Date(),
    type: "debit",
  });

  return res.status(201).send();
});

app.get("/statement/date", verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + "00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() >= new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.put("/account", verifyIfExistAccountCPF, (req, res) => {
  const { name } = req.body;

  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

app.get("/account", verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

app.delete("/account", verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

app.get("/balance", verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json(balance);
});

app.listen(3333);
