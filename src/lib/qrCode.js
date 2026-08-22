/**
 * ISO/IEC 18004 Standard-Compliant Pure JavaScript QR Code Generator
 * Features:
 * - 8-Mask pattern penalty evaluation (N1, N2, N3, N4)
 * - Standard 4-module quiet zone (mandatory for Google Lens & UPI scanners)
 * - Exact integer-module rasterization (zero subpixel distortion)
 * - Standard Reed-Solomon Error Correction Level M
 * - Fully offline & zero external dependencies
 */

const QRMode = {
  MODE_NUMBER: 1 << 0,
  MODE_ALPHA_NUM: 1 << 1,
  MODE_8BIT_BYTE: 1 << 2,
  MODE_KANJI: 1 << 3,
};

const QRErrorCorrectLevel = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

const QRMath = {
  glog: function (n) {
    if (n < 1) throw new Error('glog(' + n + ')');
    return QRMath.LOG_TABLE[n];
  },
  gexp: function (n) {
    while (n < 0) n += 255;
    while (n >= 256) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256),
};

for (let i = 0; i < 8; i++) {
  QRMath.EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}

function qrPolynomial(num, shift) {
  let offset = 0;
  while (offset < num.length && num[offset] === 0) offset++;
  const num_ = new Array(num.length - offset + shift);
  for (let i = 0; i < num.length - offset; i++) num_[i] = num[i + offset];
  for (let i = num.length - offset; i < num_.length; i++) num_[i] = 0;

  return {
    get: (index) => num_[index],
    getLength: () => num_.length,
    multiply: function (e) {
      const num2 = new Array(this.getLength() + e.getLength() - 1);
      for (let i = 0; i < num2.length; i++) num2[i] = 0;
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num2[i + j] ^= QRMath.gexp(
            QRMath.glog(this.get(i)) + QRMath.glog(e.get(j))
          );
        }
      }
      return qrPolynomial(num2, 0);
    },
    mod: function (e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num2 = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num2[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) {
        num2[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return qrPolynomial(num2, 0).mod(e);
    },
  };
}

const QRRSBlock = {
  RS_BLOCK_TABLE: [
    // L, M, Q, H
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
    [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
    [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
    [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
    [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
  ],
  getRSBlocks: function (typeNumber, errorCorrectLevel) {
    const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (!rsBlock) throw new Error('bad rs block @ typeNumber:' + typeNumber + '/errorCorrectLevel:' + errorCorrectLevel);
    const length = rsBlock.length / 3;
    const list = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) {
        list.push({ totalCount, dataCount });
      }
    }
    return list;
  },
  getRsBlockTable: function (typeNumber, errorCorrectLevel) {
    let offset;
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L: offset = 0; break;
      case QRErrorCorrectLevel.M: offset = 1; break;
      case QRErrorCorrectLevel.Q: offset = 2; break;
      case QRErrorCorrectLevel.H: offset = 3; break;
      default: return undefined;
    }
    return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + offset];
  },
};

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
    [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70]
  ],
  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
  G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
  G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),

  getBCHTypeInfo: function (data) {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },
  getBCHDigit: function (data) {
    let digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  },
  getMask: function (maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
      default: throw new Error('bad maskPattern:' + maskPattern);
    }
  },
  getLostPoint: function (qrCode) {
    const moduleCount = qrCode.getModuleCount();
    let lostPoint = 0;

    // N1: 5 or more same color in row/col
    for (let row = 0; row < moduleCount; row++) {
      let sameCount = 0;
      let head = qrCode.isDark(row, 0);
      for (let col = 0; col < moduleCount; col++) {
        const isDark = qrCode.isDark(row, col);
        if (isDark === head) {
          sameCount++;
        } else {
          if (sameCount >= 5) lostPoint += (3 + sameCount - 5);
          head = isDark;
          sameCount = 1;
        }
      }
      if (sameCount >= 5) lostPoint += (3 + sameCount - 5);
    }

    for (let col = 0; col < moduleCount; col++) {
      let sameCount = 0;
      let head = qrCode.isDark(0, col);
      for (let row = 0; row < moduleCount; row++) {
        const isDark = qrCode.isDark(row, col);
        if (isDark === head) {
          sameCount++;
        } else {
          if (sameCount >= 5) lostPoint += (3 + sameCount - 5);
          head = isDark;
          sameCount = 1;
        }
      }
      if (sameCount >= 5) lostPoint += (3 + sameCount - 5);
    }

    // N2: 2x2 same color blocks
    for (let row = 0; row < moduleCount - 1; row++) {
      for (let col = 0; col < moduleCount - 1; col++) {
        let count = 0;
        if (qrCode.isDark(row, col)) count++;
        if (qrCode.isDark(row + 1, col)) count++;
        if (qrCode.isDark(row, col + 1)) count++;
        if (qrCode.isDark(row + 1, col + 1)) count++;
        if (count === 0 || count === 4) lostPoint += 3;
      }
    }

    // N3: 1:1:3:1:1 patterns
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount - 6; col++) {
        if (
          qrCode.isDark(row, col) &&
          !qrCode.isDark(row, col + 1) &&
          qrCode.isDark(row, col + 2) &&
          qrCode.isDark(row, col + 3) &&
          qrCode.isDark(row, col + 4) &&
          !qrCode.isDark(row, col + 5) &&
          qrCode.isDark(row, col + 6)
        ) {
          lostPoint += 40;
        }
      }
    }

    for (let col = 0; col < moduleCount; col++) {
      for (let row = 0; row < moduleCount - 6; row++) {
        if (
          qrCode.isDark(row, col) &&
          !qrCode.isDark(row + 1, col) &&
          qrCode.isDark(row + 2, col) &&
          qrCode.isDark(row + 3, col) &&
          qrCode.isDark(row + 4, col) &&
          !qrCode.isDark(row + 5, col) &&
          qrCode.isDark(row + 6, col)
        ) {
          lostPoint += 40;
        }
      }
    }

    // N4: Dark / Light balance
    let darkCount = 0;
    for (let col = 0; col < moduleCount; col++) {
      for (let row = 0; row < moduleCount; row++) {
        if (qrCode.isDark(row, col)) darkCount++;
      }
    }
    const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
    lostPoint += ratio * 10;

    return lostPoint;
  },
};

function qrBitBuffer() {
  const buffer = [];
  let length = 0;
  return {
    get: (index) => ((buffer[Math.floor(index / 8)] >>> (7 - (index % 8))) & 1) === 1,
    put: function (num, len) {
      for (let i = 0; i < len; i++) {
        this.putBit(((num >>> (len - i - 1)) & 1) === 1);
      }
    },
    getLengthInBits: () => length,
    putBit: function (bit) {
      const bufIndex = Math.floor(length / 8);
      if (buffer.length <= bufIndex) buffer.push(0);
      if (bit) buffer[bufIndex] |= 0x80 >>> (length % 8);
      length++;
    },
  };
}

function qr8BitByte(data) {
  // UTF-8 byte encoding
  const bytes = [];
  for (let i = 0; i < data.length; i++) {
    let c = data.charCodeAt(i);
    if (c < 128) {
      bytes.push(c);
    } else if (c < 2048) {
      bytes.push(192 | (c >> 6));
      bytes.push(128 | (c & 63));
    } else if (c < 65536) {
      bytes.push(224 | (c >> 12));
      bytes.push(128 | ((c >> 6) & 63));
      bytes.push(128 | (c & 63));
    } else {
      bytes.push(240 | (c >> 18));
      bytes.push(128 | ((c >> 12) & 63));
      bytes.push(128 | ((c >> 6) & 63));
      bytes.push(128 | (c & 63));
    }
  }

  return {
    mode: QRMode.MODE_8BIT_BYTE,
    getLength: () => bytes.length,
    write: function (buffer) {
      for (let i = 0; i < bytes.length; i++) {
        buffer.put(bytes[i], 8);
      }
    },
  };
}

function QRCodeModel(typeNumber, errorCorrectLevel) {
  let modules = null;
  let moduleCount = 0;
  const dataList = [];

  return {
    addData: (data) => dataList.push(qr8BitByte(data)),
    isDark: (row, col) => modules[row][col],
    getModuleCount: () => moduleCount,
    make: function () {
      let minLostPoint = Infinity;
      let bestPattern = 0;
      for (let i = 0; i < 8; i++) {
        this.makeImpl(false, i);
        const lostPoint = QRUtil.getLostPoint(this);
        if (lostPoint < minLostPoint) {
          minLostPoint = lostPoint;
          bestPattern = i;
        }
      }
      this.makeImpl(false, bestPattern);
    },
    makeImpl: function (test, maskPattern) {
      moduleCount = typeNumber * 4 + 17;
      modules = new Array(moduleCount);
      for (let row = 0; row < moduleCount; row++) {
        modules[row] = new Array(moduleCount);
        for (let col = 0; col < moduleCount; col++) modules[row][col] = null;
      }

      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(moduleCount - 7, 0);
      this.setupPositionProbePattern(0, moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);
      this.mapData(this.createData(typeNumber, errorCorrectLevel), maskPattern);
    },
    setupPositionProbePattern: function (row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || moduleCount <= col + c) continue;
          if (
            (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)
          ) {
            modules[row + r][col + c] = true;
          } else {
            modules[row + r][col + c] = false;
          }
        }
      }
    },
    setupTimingPattern: function () {
      for (let r = 8; r < moduleCount - 8; r++) {
        if (modules[r][6] !== null) continue;
        modules[r][6] = r % 2 === 0;
      }
      for (let c = 8; c < moduleCount - 8; c++) {
        if (modules[6][c] !== null) continue;
        modules[6][c] = c % 2 === 0;
      }
    },
    setupPositionAdjustPattern: function () {
      const pos = QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          const row = pos[i];
          const col = pos[j];
          if (modules[row][col] !== null) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                modules[row + r][col + c] = true;
              } else {
                modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    },
    setupTypeInfo: function (test, maskPattern) {
      const data = (errorCorrectLevel << 3) | maskPattern;
      const bits = QRUtil.getBCHTypeInfo(data);

      for (let i = 0; i < 15; i++) {
        const mod = !test && ((bits >> i) & 1) === 1;
        if (i < 6) modules[i][8] = mod;
        else if (i < 8) modules[i + 1][8] = mod;
        else modules[moduleCount - 15 + i][8] = mod;

        if (i < 8) modules[8][moduleCount - i - 1] = mod;
        else if (i < 9) modules[8][15 - i - 1 + 1] = mod;
        else modules[8][15 - i - 1] = mod;
      }
      modules[moduleCount - 8][8] = !test;
    },
    mapData: function (data, maskPattern) {
      let inc = -1;
      let row = moduleCount - 1;
      let bitIndex = 7;
      let byteIndex = 0;

      for (let col = moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (modules[row][col - c] === null) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
              }
              const mask = QRUtil.getMask(maskPattern, row, col - c);
              if (mask) dark = !dark;
              modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    },
    createData: function (type, ecLevel) {
      const rsBlocks = QRRSBlock.getRSBlocks(type, ecLevel);
      const buffer = qrBitBuffer();
      for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), type < 10 ? 8 : 16);
        data.write(buffer);
      }

      let totalDataCount = 0;
      for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error('code length overflow. (' + buffer.getLengthInBits() + '>' + totalDataCount * 8 + ')');
      }

      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
      while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);

      while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) break;
        buffer.put(0xec, 8);
        if (buffer.getLengthInBits() >= totalDataCount * 8) break;
        buffer.put(0x11, 8);
      }

      return this.createBytes(buffer, rsBlocks);
    },
    createBytes: function (buffer, rsBlocks) {
      let offset = 0;
      let maxDcCount = 0;
      let maxEcCount = 0;
      const dcdata = new Array(rsBlocks.length);
      const ecdata = new Array(rsBlocks.length);

      for (let r = 0; r < rsBlocks.length; r++) {
        const dcCount = rsBlocks[r].dataCount;
        const ecCount = rsBlocks[r].totalCount - dcCount;
        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);
        for (let i = 0; i < dcdata[r].length; i++) {
          dcdata[r][i] = 0xff & buffer.buffer ? buffer.buffer[i + offset] : (buffer.get ? (function() {
            let b = 0;
            for (let bit = 0; bit < 8; bit++) {
              if (buffer.get((i + offset) * 8 + bit)) b |= 0x80 >>> bit;
            }
            return b;
          })() : 0);
        }
        offset += dcCount;

        const rsPoly = (function(ecCount) {
          let poly = qrPolynomial([1], 0);
          for (let i = 0; i < ecCount; i++) {
            poly = poly.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
          }
          return poly;
        })(ecCount);

        const rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);
        const modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (let i = 0; i < ecdata[r].length; i++) {
          const modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
        }
      }

      let totalCodeCount = 0;
      for (let i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
      const data = new Array(totalCodeCount);
      let index = 0;

      for (let i = 0; i < maxDcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) data[index++] = dcdata[r][i];
        }
      }
      for (let i = 0; i < maxEcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) data[index++] = ecdata[r][i];
        }
      }
      return data;
    },
  };
}

/**
 * Generates an ISO/IEC 18004 compliant QR Code Data URL.
 * Automatically ensures the mandatory 4-module quiet zone and integer-pixel scaling.
 */
export function generateQrDataUrl(text, targetSize = 200) {
  if (!text) return '';

  let typeNumber = 1;
  let qr;

  while (typeNumber <= 14) {
    try {
      qr = QRCodeModel(typeNumber, QRErrorCorrectLevel.M);
      qr.addData(text);
      qr.make();
      break;
    } catch (e) {
      typeNumber++;
      if (typeNumber > 14) {
        console.error('Text is too long for QR generator', e);
        return '';
      }
    }
  }

  const moduleCount = qr.getModuleCount();
  const quietZoneModules = 4; // Mandatory ISO/IEC 18004 4-cell quiet zone
  const totalModules = moduleCount + quietZoneModules * 2;

  // Integer scale per module to guarantee 100% crisp, unblurred edges
  const scale = Math.max(3, Math.floor(targetSize / totalModules));
  const finalDimension = totalModules * scale;

  const canvas = document.createElement('canvas');
  canvas.width = finalDimension;
  canvas.height = finalDimension;
  const ctx = canvas.getContext('2d');

  // 1. Crisp solid white quiet zone background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, finalDimension, finalDimension);

  // 2. High-contrast solid black QR modules
  ctx.fillStyle = '#000000';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          (col + quietZoneModules) * scale,
          (row + quietZoneModules) * scale,
          scale,
          scale
        );
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Builds the standard NPCI UPI URI string.
 */
export function buildUpiPaymentUri({
  companySettings,
  amount,
  invoiceNo,
}) {
  if (!companySettings) return null;

  const { upi_mode, upi_id, upi_phone, bank_account_no, bank_ifsc, company_name } = companySettings;

  let pa = '';
  if (upi_mode === 'bank_account' && bank_account_no && bank_ifsc) {
    // Standard NPCI virtual address for direct Account + IFSC routing
    pa = `${bank_account_no.trim()}@${bank_ifsc.trim().toUpperCase()}.ifsc.npci`;
  } else if (upi_id && upi_id.trim()) {
    pa = upi_id.trim();
  } else if (upi_phone && upi_phone.trim()) {
    pa = `${upi_phone.trim()}@upi`;
  }

  if (!pa) return null;

  const pn = encodeURIComponent((company_name || 'GPR Printers').trim());
  const am = parseFloat(amount || 0).toFixed(2);
  const tn = encodeURIComponent(`Invoice ${invoiceNo || ''}`.trim());

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}
