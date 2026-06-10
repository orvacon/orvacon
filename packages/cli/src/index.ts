#!/usr/bin/env node

const VERSION = "0.0.1";

const HELP = `orvacon — provider-bağımsız, TypeScript-first ödeme orchestration

Kullanım
  orvacon <komut> [seçenekler]

Komutlar
  (henüz yok — bu sürüm bir placeholder)

Seçenekler
  -v, --version   sürümü yazdır
  -h, --help      bu yardımı göster

Daha fazlası: https://orvacon.com`;

function main(args: string[]): number {
  const arg = args[0];

  if (arg === "-v" || arg === "--version") {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (!arg || arg === "-h" || arg === "--help") {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }

  process.stderr.write(`Bilinmeyen komut: ${arg}\nYardım için: orvacon --help\n`);
  return 1;
}

process.exit(main(process.argv.slice(2)));
