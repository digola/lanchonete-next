/**
 * Script de Debug Específico para Status da Mesa
 * 
 * Para usar:
 * 1. Abra o console do navegador (F12)
 * 2. Cole este script
 * 3. Execute: debugTableStatus('table_id')
 */

console.log('🔍 Script de Debug de Status da Mesa Carregado!');

async function debugTableStatus(tableId) {
    console.log('🔍 DEBUGANDO STATUS DA MESA');
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
        console.log('\n1️⃣ Status atual da mesa...');
        const tableResponse = await fetch(`${baseUrl}/api/tables/${tableId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (tableResponse.ok) {
            const tableData = await tableResponse.json();
            console.log('📊 Mesa atual:', {
                id: tableData.data?.id,
                number: tableData.data?.number,
                status: tableData.data?.status,
                assignedTo: tableData.data?.assignedTo
            });
        } else {
            console.error('❌ Erro ao buscar mesa:', await tableResponse.text());
            return;
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
            
            if (activeOrders.length > 0) {
                console.log('🔒 Mesa deve estar OCUPADA');
                activeOrders.forEach((order, index) => {
                    console.log(`   ${index + 1}. Pedido ${order.id}:`);
                    console.log(`      - Status: ${order.status}`);
                    console.log(`      - isActive: ${order.isActive}`);
                    console.log(`      - isPaid: ${order.isPaid}`);
                    console.log(`      - isReceived: ${order.isReceived}`);
                });
            } else {
                console.log('✅ Mesa deve estar LIVRE');
            }
        } else {
            console.error('❌ Erro ao buscar pedidos ativos:', await ordersResponse.text());
        }
        
        // 3. Testar atualização de status da mesa
        console.log('\n3️⃣ Testando atualização de status da mesa...');
        const statusResponse = await fetch(`${baseUrl}/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Status atualizado:', statusData);
            console.log('📊 Novo status da mesa:', statusData.data?.table?.status);
            console.log('📊 Mesa atribuída a:', statusData.data?.table?.assignedTo);
            console.log('📊 Pedidos ativos:', statusData.data?.activeOrders?.length || 0);
        } else {
            console.error('❌ Erro ao atualizar status:', await statusResponse.text());
        }
        
        // 4. Verificar status final
        console.log('\n4️⃣ Verificando status final...');
        const finalResponse = await fetch(`${baseUrl}/api/tables/${tableId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (finalResponse.ok) {
            const finalData = await finalResponse.json();
            console.log('📊 Status final da mesa:', {
                status: finalData.data?.status,
                assignedTo: finalData.data?.assignedTo
            });
            
            if (finalData.data?.status === 'LIVRE') {
                console.log('✅ Mesa está LIVRE!');
            } else if (finalData.data?.status === 'OCUPADA') {
                console.log('🔒 Mesa está OCUPADA');
            } else {
                console.log('❓ Status desconhecido:', finalData.data?.status);
            }
        } else {
            console.error('❌ Erro ao verificar status final:', await finalResponse.text());
        }
        
        console.log('\n🎉 DEBUG CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ ERRO NO DEBUG:', error);
    }
}

// Função para testar apenas a atualização de status
async function testarAtualizacaoStatus(tableId) {
    console.log('🔄 TESTANDO ATUALIZAÇÃO DE STATUS');
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
            console.log('✅ Resposta da API:', data);
            
            if (data.success) {
                console.log('📊 Mesa atualizada:', data.data?.table);
                console.log('📊 Status:', data.data?.table?.status);
                console.log('📊 Atribuída a:', data.data?.table?.assignedTo);
                console.log('📊 Pedidos ativos:', data.data?.activeOrders?.length || 0);
            } else {
                console.error('❌ API retornou erro:', data.error);
            }
        } else {
            console.error('❌ Erro HTTP:', response.status, await response.text());
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

// Função para forçar mesa como LIVRE
async function forcarMesaLivre(tableId) {
    console.log('🆓 FORÇANDO MESA COMO LIVRE');
    console.log('=' .repeat(40));
    
    const baseUrl = window.location.origin;
    const token = localStorage.getItem('auth-token');
    
    try {
        // Primeiro, verificar se há pedidos ativos
        const ordersResponse = await fetch(`${baseUrl}/api/orders?tableId=${tableId}&isActive=true`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            const activeOrders = ordersData.data || [];
            
            if (activeOrders.length > 0) {
                console.log('⚠️ Há pedidos ativos na mesa. Cancelando primeiro...');
                
                // Cancelar todos os pedidos ativos
                for (const order of activeOrders) {
                    const cancelResponse = await fetch(`${baseUrl}/api/orders/${order.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: 'CANCELADO' })
                    });
                    
                    if (cancelResponse.ok) {
                        console.log(`✅ Pedido ${order.id} cancelado`);
                    } else {
                        console.error(`❌ Erro ao cancelar pedido ${order.id}`);
                    }
                }
            }
        }
        
        // Agora atualizar status da mesa
        const statusResponse = await fetch(`${baseUrl}/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Mesa forçada como LIVRE:', statusData);
        } else {
            console.error('❌ Erro ao forçar mesa como LIVRE:', await statusResponse.text());
        }
        
    } catch (error) {
        console.error('❌ Erro ao forçar mesa como LIVRE:', error);
    }
}

// Exportar funções
window.debugTableStatus = debugTableStatus;
window.testarAtualizacaoStatus = testarAtualizacaoStatus;
window.forcarMesaLivre = forcarMesaLivre;

console.log('📋 Comandos disponíveis:');
console.log('  - debugTableStatus("table_id") - Debug completo');
console.log('  - testarAtualizacaoStatus("table_id") - Testar atualização');
console.log('  - forcarMesaLivre("table_id") - Forçar mesa como LIVRE');
