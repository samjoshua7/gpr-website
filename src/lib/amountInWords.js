const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num) {
  if (num === 0) return '';
  let str = '';

  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }

  if (num > 0) {
    str += ones[num] + ' ';
  }

  return str;
}

export function amountInWords(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }

  const num = Math.abs(Number(amount));
  if (num === 0) return 'Rupees Zero Only';

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';

  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    let rem = rupees % 10000000;

    const lakh = Math.floor(rem / 100000);
    rem %= 100000;

    const thousand = Math.floor(rem / 1000);
    rem %= 1000;

    const hundred = rem;

    if (crore > 0) {
      result += convertLessThanThousand(crore).trim() + ' Crore ';
    }
    if (lakh > 0) {
      result += convertLessThanThousand(lakh).trim() + ' Lakh ';
    }
    if (thousand > 0) {
      result += convertLessThanThousand(thousand).trim() + ' Thousand ';
    }
    if (hundred > 0) {
      result += convertLessThanThousand(hundred).trim() + ' ';
    }

    result = 'Rupees ' + result.trim();
  } else {
    result = 'Rupees Zero';
  }

  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise).trim() + ' Paise';
  }

  return result + ' Only';
}

export default amountInWords;
