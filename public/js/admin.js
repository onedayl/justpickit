const logoutBtn = document.getElementById('logout');
const update = document.getElementById('update');

logoutBtn.addEventListener('click', (e) => {
  if (e.target.classList.contains('disabled')) {
    return false;
  } else {
    const xhr = new XMLHttpRequest;
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          window.location = '/login';
        } else {
          alert('Logout fail.');
        }
      }
    }
    xhr.open('DELETE', '/login');
    xhr.send();
  }
});

update.addEventListener('click', (e) => {
  const updateBtn = e.target;
  if (updateBtn.classList.contains('disabled')) {
    console.log('Wait for response, please.');
    return false;
  } else {
    updateBtn.classList.toggle('disabled');
    updateBtn.innerText = '...';
    const xhr = new XMLHttpRequest;
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          updateBtn.innerText = `New (${xhr.responseText}) `;
          window.setTimeout(() => {
            updateBtn.innerText = 'Update';
            updateBtn.classList.toggle('disabled');
          }, 2000);
        } else {
          alert('Update fail.');
        }
      }
    }
    xhr.open('PUT', '/data/wish');
    xhr.send();
  }
});

clear.addEventListener('click', (e) => {
  const clearBtn = e.target;
  if (clearBtn.classList.contains('disabled')) {
    console.log('Wait for response, please.');
    return false;
  } else {
    clearBtn.classList.toggle('disabled');
    clearBtn.innerText = '...';
    const xhr = new XMLHttpRequest;
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          clearBtn.innerText = `Del (${xhr.responseText}) `;
          window.setTimeout(() => {
            clearBtn.innerText = 'Clear';
            clearBtn.classList.toggle('disabled');
          }, 2000);
        } else {
          alert('Clear fail.');
        }
      }
    }
    xhr.open('DELETE', '/data/collect');
    xhr.send();
  }
});
