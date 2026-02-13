export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    const net = await import("node:net");

    dns.setDefaultResultOrder("ipv4first");
    net.setDefaultAutoSelectFamily(false);
  }
}
