import React, { useEffect } from 'react';

const TestKkiapaySimple = () => {
    useEffect(() => {
        // Charger le script
        const script = document.createElement('script');
        script.src = 'https://cdn.kkiapay.me/k.js';
        script.onload = () => {
            console.log('Script chargé');
            console.log('Window.Kkiapay:', window.Kkiapay);
            
            if (window.Kkiapay) {
                alert('✅ Kkiapay chargé avec succès!');
            }
        };
        script.onerror = () => {
            alert('❌ Erreur de chargement');
        };
        document.body.appendChild(script);
    }, []);

    const testKkiapay = () => {
        if (window.Kkiapay) {
            window.Kkiapay.open({
                amount: 100,
                key: '69a6eae91dfe93dd00cc51a7',
                sandbox: true,
                phone: '97000000',
                reason: 'Test'
            });
        } else {
            alert('Kkiapay non disponible');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h3>Test Kkiapay</h3>
            <button onClick={testKkiapay} className="btn btn-primary">
                Tester Kkiapay
            </button>
        </div>
    );
};

export default TestKkiapaySimple;