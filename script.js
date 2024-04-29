// Função para verificar se os cookies foram aceitos anteriormente
function areCookiesAccepted() {
    return localStorage.getItem('cookiesAccepted') === 'true';
}

// Função para definir os cookies como aceitos e ocultar a mensagem
function acceptCookies() {
    localStorage.setItem('cookiesAccepted', 'true');
    document.getElementById('cookieConsent').style.display = 'none';
}

// Função para exibir a mensagem de consentimento de cookies se ainda não tiver sido aceita neste mês
function showCookieConsent() {
    if (!areCookiesAccepted()) {
        var lastAccepted = localStorage.getItem('lastAccepted');
        var fiveMinutesAgo = new Date().getTime() - (5 * 60 * 1000); // Calcula o tempo 5 minutos atrás em milissegundos
        if (!lastAccepted || lastAccepted < fiveMinutesAgo) {
            document.getElementById('cookieConsent').style.display = 'block';
        }
    }
}

// Exibir a mensagem de consentimento de cookies quando a página carregar
window.onload = function() {
    showCookieConsent();
};