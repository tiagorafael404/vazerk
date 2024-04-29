// Função para verificar se os cookies foram aceitos anteriormente
function areCookiesAccepted() {
    return localStorage.getItem('cookiesAccepted') === 'true';
}

// Função para definir os cookies como aceitos e ocultar a mensagem
function acceptCookies() {
    localStorage.setItem('cookiesAccepted', 'true');
    document.getElementById('cookieConsent').style.display = 'none';
}

// Função para exibir a mensagem de consentimento de cookies se ainda não tiver sido aceita após 1 mês
function showCookieConsent() {
    if (!areCookiesAccepted()) {
        var lastAccepted = localStorage.getItem('lastAccepted');
        var oneMonthAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000); // Calcula o tempo 1 mês atrás em milissegundos
        if (!lastAccepted || lastAccepted < oneMonthAgo) {
            document.getElementById('cookieConsent').style.display = 'block';
        }
    }
}

// Exibir a mensagem de consentimento de cookies quando a página carregar
window.onload = function() {
    showCookieConsent();
};