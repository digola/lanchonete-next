import { describe, it, expect } from '@jest/globals';

describe('Testes Básicos do Sistema', () => {
  it('deve somar dois números corretamente', () => {
    expect(1 + 1).toBe(2);
  });

  it('deve verificar se string contém texto', () => {
    expect('Lanchonete Next.js').toContain('Next.js');
  });

  it('deve verificar se array contém elemento', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toContain('banana');
  });

  it('deve verificar se objeto tem propriedade', () => {
    const user = {
      id: '123',
      name: 'João Silva',
      email: 'joao@email.com'
    };
    
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name', 'João Silva');
    expect(user.email).toBe('joao@email.com');
  });

  it('deve verificar tipos de dados', () => {
    expect(typeof 'string').toBe('string');
    expect(typeof 123).toBe('number');
    expect(typeof true).toBe('boolean');
    expect(Array.isArray([])).toBe(true);
  });

  it('deve testar promessas resolvidas', async () => {
    const promise = Promise.resolve('sucesso');
    await expect(promise).resolves.toBe('sucesso');
  });

  it('deve testar promessas rejeitadas', async () => {
    const promise = Promise.reject(new Error('erro'));
    await expect(promise).rejects.toThrow('erro');
  });
});
