/**
 * Script de Debug para Liberação da Mesa
 * 
 * Para usar:
 * 1. Abra o console do navegador (F12)
 * 2. Cole este script
 * 3. Execute: debugTableRelease('table_id')
 */

console.log('🔍 Script de Debug para Liberação da Mesa Carregado!');

async function debugTableRelease(tableId) {
    console.log('🔍 DEBUGANDO LIBERAÇÃO DA MESA');
    console.log('=' .repeat(50));
    console.log('Mesa ID:', tableId);
    
    const baseUrl = window.location.origin;
    const token = localStorage.getItem('auth-token');
    
    if (!token) {
        console.error('❌ Token de autenticação não encontrado!');
        return;
    }
    
    try {
        // 1. Verificar status atual da mesa
        console.log('\n1️⃣ Verificando status atual da mesa...');
        const tableResponse = await fetch(`${baseUrl}/api/tables/${tableId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (tableResponse.ok) {
            const tableData = await tableResponse.json();
            console.log('📊 Status atual da mesa:', tableData.data?.status);
            console.log('📊 Mesa atribuída a:', tableData.data?.assignedTo);
        } else {
            console.error('❌ Erro ao buscar mesa:', await tableResponse.text());
        }
        
        // 2. Verificar pedidos ativos
        console.log('\n2️⃣ Verificando pedidos ativos...');
        const ordersResponse = await fetch(`${baseUrl}/api/orders?tableId=${tableId}&isActive=true`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            const activeOrders = ordersData.data || [];
            console.log('📊 Pedidos ativos encontrados:', activeOrders.length);
            
            activeOrders.forEach((order, index) => {
                console.log(`   ${index + 1}. Pedido ${order.id}:`);
                console.log(`      - Status: ${order.status}`);
                console.log(`      - isActive: ${order.isActive}`);
                console.log(`      - isPaid: ${order.isPaid}`);
                console.log(`      - isReceived: ${order.isReceived}`);
            });
        } else {
            console.error('❌ Erro ao buscar pedidos:', await ordersResponse.text());
        }
        
        // 3. Verificar todos os pedidos da mesa (ativos e inativos)
        console.log('\n3️⃣ Verificando todos os pedidos da mesa...');
        const allOrdersResponse = await fetch(`${baseUrl}/api/orders?tableId=${tableId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (allOrdersResponse.ok) {
            const allOrdersData = await allOrdersResponse.json();
            const allOrders = allOrdersData.data || [];
            console.log('📊 Total de pedidos na mesa:', allOrders.length);
            
            allOrders.forEach((order, index) => {
                console.log(`   ${index + 1}. Pedido ${order.id}:`);
                console.log(`      - Status: ${order.status}`);
                console.log(`      - isActive: ${order.isActive}`);
                console.log(`      - isPaid: ${order.isPaid}`);
                console.log(`      - isReceived: ${order.isReceived}`);
                console.log(`      - Criado em: ${order.createdAt}`);
            });
        } else {
            console.error('❌ Erro ao buscar todos os pedidos:', await allOrdersResponse.text());
        }
        
        // 4. Testar liberação manual da mesa
        console.log('\n4️⃣ Testando liberação manual da mesa...');
        const releaseResponse = await fetch(`${baseUrl}/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (releaseResponse.ok) {
            const releaseData = await releaseResponse.json();
            console.log('✅ Mesa liberada manualmente:', releaseData);
            console.log('📊 Novo status:', releaseData.data?.table?.status);
        } else {
            console.error('❌ Erro ao liberar mesa:', await releaseResponse.text());
        }
        
        // 5. Verificar status final da mesa
        console.log('\n5️⃣ Verificando status final da mesa...');
        const finalTableResponse = await fetch(`${baseUrl}/api/tables/${tableId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (finalTableResponse.ok) {
            const finalTableData = await finalTableResponse.json();
            console.log('📊 Status final da mesa:', finalTableData.data?.status);
            console.log('📊 Mesa atribuída a:', finalTableData.data?.assignedTo);
        } else {
            console.error('❌ Erro ao verificar status final:', await finalTableResponse.text());
        }
        
        console.log('\n🎉 DEBUG CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ ERRO NO DEBUG:', error);
    }
}

// Função para verificar apenas pedidos ativos
async function verificarPedidosAtivos(tableId) {
    console.log('📊 VERIFICANDO PEDIDOS ATIVOS');
    console.log('=' .repeat(40));
    
    const baseUrl = window.location.origin;
    const token = localStorage.getItem('auth-token');
    
    try {
        const response = await fetch(`${baseUrl}/api/orders?tableId=${tableId}&isActive=true`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const orders = data.data || [];
            
            console.log('📊 Pedidos ativos encontrados:', orders.length);
            
            if (orders.length === 0) {
                console.log('✅ Nenhum pedido ativo - mesa pode ser liberada');
            } else {
                console.log('🔒 Há pedidos ativos - mesa deve permanecer ocupada');
                orders.forEach((order, index) => {
                    console.log(`   ${index + 1}. ${order.id} - ${order.status} (isActive: ${order.isActive})`);
                });
            }
        } else {
            console.error('❌ Erro ao buscar pedidos ativos:', await response.text());
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar pedidos ativos:', error);
    }
}

// Função para forçar liberação da mesa
async function forcarLiberacaoMesa(tableId) {
    console.log('🆓 FORÇANDO LIBERAÇÃO DA MESA');
    console.log('=' .repeat(40));
    
    const baseUrl = window.location.origin;
    const token = localStorage.getItem('auth-token');
    
    try {
        const response = await fetch(`${baseUrl}/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Mesa liberada forçadamente:', data);
        } else {
            console.error('❌ Erro ao forçar liberação:', await response.text());
        }
        
    } catch (error) {
        console.error('❌ Erro ao forçar liberação:', error);
    }
}

// Exportar funções
window.debugTableRelease = debugTableRelease;
window.verificarPedidosAtivos = verificarPedidosAtivos;
window.forcarLiberacaoMesa = forcarLiberacaoMesa;

console.log('📋 Comandos disponíveis:');
console.log('  - debugTableRelease("table_id") - Debug completo');
console.log('  - verificarPedidosAtivos("table_id") - Verificar pedidos ativos');
console.log('  - forcarLiberacaoMesa("table_id") - Forçar liberação');
