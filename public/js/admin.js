const logoutBtn = document.getElementById('logout');
let httpRequest;
logoutBtn.addEventListener('click', makeRequest);

function makeRequest() {
  httpRequest = new XMLHttpRequest;

  if (!httpRequest) {
    alert('Cannot create an XMLHttp instance');
    return false;
  }

  httpRequest.onreadystatechange = handleResponse;
  httpRequest.open('DELETE', '/admin');
  httpRequest.send();
}

function handleResponse() {
  if (httpRequest.readyState === XMLHttpRequest.DONE) {
    if (httpRequest.status === 200) {
      window.location = '/login';
    } else {
      alert('Logout fail.');
    }
  }
}
