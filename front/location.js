navigator.geolocation.getCurrentPosition(pos => {
  document.getElementById('sign_up_lat').value = pos.coords.latitude;
  document.getElementById('sign_up_lon').value = pos.coords.longitude;
});


document.getElementById('sign_up_button').addEventListener('click', () => {
  let form_data = new FormData(document.getElementById('sign_up_form'));
  fetch('https://location-tracking-server-7.herokuapp.com', {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    body: form_data,
  })
  .then(response => {
    if(response.ok) {
      return response.text();
    }
    throw new Error('通信エラー');
  })
  .then(res_text => {
    console.log(res_text);
    document.getElementById('sign_up_result').textContent = '応答：' + res_text;
  })
  .catch(error => {
    console.log(error.message);
  });
}, false);


document.getElementById('search_button').addEventListener('click', () => {
  let params = new URLSearchParams;
  params.set('search_id_number', document.getElementById('search_id_number').value);
  fetch('https://location-tracking-server-7.herokuapp.com?' + params.toString(), {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  })
  .then(response => {
    if(response.ok) {
      return response.json();
    }
    throw new Error('通信エラー');
  })
  .then(res_json => {
    document.getElementById('searched_lat').textContent = res_json.searched_lat;
    document.getElementById('searched_lon').textContent = res_json.searched_lon;
    document.getElementById('search_result').textContent = '応答：' + res_json.search_result;
  })
  .catch(error => {
    console.log(error.message);
  });
}, false);