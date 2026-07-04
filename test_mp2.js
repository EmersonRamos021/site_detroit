const { MercadoPagoConfig, Payment } = require('mercadopago');

async function test() {
  try {
    const client = new MercadoPagoConfig({ accessToken: '"APP_USR-59006ee5-0710-4c5c-b4d3-c2ad23ce9a03"' });
    const payment = new Payment(client);
    
    await payment.create({
      body: {
        transaction_amount: 10,
        description: "Test",
        payment_method_id: "pix",
        payer: { email: "test@test.com" }
      }
    });
    console.log("Success");
  } catch (err) {
    console.error("Error cause:", err.cause);
    console.error("Error message:", err.message);
  }
}
test();
