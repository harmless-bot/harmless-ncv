// Educational graph-based encryption over GF(257)

const PRIME = 257;

export type Matrix = number[][];

export const mod = (n: number, m: number = PRIME) => {
  return ((n % m) + m) % m;
};

export const modInverse = (a: number, m: number = PRIME): number | null => {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) {
      return x;
    }
  }
  return null;
};

// Determinant and Inverse for 4x4 matrices is complex, we will use a simpler approach (e.g., Gaussian elimination) to find the inverse.
export const inverseMatrix = (M: Matrix, p: number = PRIME): Matrix | null => {
  const n = M.length;
  const A = M.map(row => [...row]);
  const inv: number[][] = Array.from({ length: n }, (_, i) => 
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  for (let i = 0; i < n; i++) {
    let pivot = i;
    while (pivot < n && A[pivot][i] === 0) pivot++;
    if (pivot === n) return null; // Singular matrix

    if (pivot !== i) {
      const tempA = A[i]; A[i] = A[pivot]; A[pivot] = tempA;
      const tempInv = inv[i]; inv[i] = inv[pivot]; inv[pivot] = tempInv;
    }

    const invPivot = modInverse(A[i][i], p)!;
    for (let j = 0; j < n; j++) {
      A[i][j] = mod(A[i][j] * invPivot, p);
      inv[i][j] = mod(inv[i][j] * invPivot, p);
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = 0; j < n; j++) {
          A[k][j] = mod(A[k][j] - factor * A[i][j], p);
          inv[k][j] = mod(inv[k][j] - factor * inv[i][j], p);
        }
      }
    }
  }
  return inv;
};

export const multiplyMatrices = (A: Matrix, B: Matrix, p: number = PRIME): Matrix => {
  const n = A.length;
  const C = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = mod(sum, p);
    }
  }
  return C;
};

// Generate M1 (Adjacency matrix of complete graph with weights based on characters and keyword)
export const generateM1 = (text: string, keyword: string): Matrix => {
  const n = text.length;
  const M1 = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const diff = Math.abs(text.charCodeAt(i) - text.charCodeAt(j));
        const keyVal = keyword.charCodeAt((i + j) % keyword.length);
        M1[i][j] = mod(diff + keyVal, PRIME);
      }
    }
  }
  return M1;
};

// Generate M2 (MST of M1 using Prim's algorithm)
export const generateM2 = (M1: Matrix): Matrix => {
  const n = M1.length;
  const M2 = Array.from({ length: n }, () => Array(n).fill(0));
  const selected = Array(n).fill(false);
  selected[0] = true;
  let edges = 0;

  while (edges < n - 1) {
    let min = Infinity;
    let u = 0, v = 0;
    
    for (let i = 0; i < n; i++) {
      if (selected[i]) {
        for (let j = 0; j < n; j++) {
          if (!selected[j] && M1[i][j]) {
            if (M1[i][j] < min) {
              min = M1[i][j];
              u = i;
              v = j;
            }
          }
        }
      }
    }
    selected[v] = true;
    M2[u][v] = min;
    M2[v][u] = min;
    edges++;
  }
  
  return M2;
};

// Generate a random invertible key matrix K
export const generateKeyMatrix = (n: number): Matrix => {
  while (true) {
    const K = Array.from({ length: n }, () => 
      Array.from({ length: n }, () => Math.floor(Math.random() * 256) + 1)
    );
    if (inverseMatrix(K) !== null) {
      return K;
    }
  }
};
