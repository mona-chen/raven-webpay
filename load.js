if (response.status == 'success') {
    if (response['data']['3ds_auth'] === true) {
        //load a hidden div that will be part of data response for 21 seconds
        //then send back to server to initiate the transaction
        $('#submit').html('<i class="mdi mdi-loading mdi-spin"></i> Performing 3ds auth ...');
        let divData = response.data.data;
        let div = document.createElement('div');
        //make the div hidden
        div.style.display = 'none';
        div.innerHTML = divData;
        document.body.appendChild(div);
        //wait for 21 seconds
        setTimeout(function() {
            //send back to server to initiate the transaction
            let url = 'initiate_3ds_transaction';
            let bearerToken = ''
            let dataToSend = {
                merchant_reference: response.data.merchant_reference,
            }
            $.ajax({
                url: url,
                type: 'POST',
                data: dataToSend,
                headers: {
                    'Authorization': 'Bearer ' + bearerToken
                },
                success: function(response) {
                    console.log('initiate_3ds', response)
                    if (response.status == 'success') {
                        //load div that contains iframe for token authentication
                        let divData = response.data.data;
                        $("#token_form").append(divData);
                        let merchantReference = response.data.merchant_reference;
                        let bearerToken = ''
                            // let url = 'https://baas.getraventest.com/verify_card_transaction?merchant_reference=' + merchantReference;
                        let url = 'verify_card_transaction?merchant_reference=' + merchantReference;
                        //send verify transaction request every 5 seconds for 30 minutes till transaction is completed
                        let interval = setInterval(function() {
                            $.ajax({
                                url: url,
                                type: 'GET',
                                headers: {
                                    'Authorization': 'Bearer ' + bearerToken
                                },
                                success: function(response) {
                                    console.log('verify_card', response)
                                    if (response.status == 'success') {
                                        if (response.data.status == 'successful') {
                                            alert('Transaction successful');
                                            clearInterval(interval);
                                        } else if (response.data.status == 'failed') {
                                            alert('Transaction failed');
                                            clearInterval(interval);
                                        }
                                    } else {
                                        alert('Transaction failed');
                                        clearInterval(interval);
                                    }
                                },
                                error: function(error) {
                                    console.log('error', error)
                                        //alert('error occured')
                                }
                            })
                        }, 8000);
                    } else {
                        alert('Transaction failed');
                    }
                },
                error: function(error) {
                    console.log('error', error)
                        // alert('error occured')
                }
            })
        }, 21000);
    } else {
        //maketoken reecieve form display
        $("#token_recieve_form").css('display', 'block');
        $("#merchant_reference").val(response.data.merchant_reference);
        $('#submit').html('<i class="mdi mdi-loading mdi-spin"></i> Submit Authentication token ...');
        alert('Enter token');
        let merchantReference = response.data.merchant_reference;
        let bearerToken = ''
            //let url = 'https://baas.getraventest.com/verify_card_transaction?merchant_reference=' + merchantReference;
        let url = 'verify_card_transaction?merchant_reference=' + merchantReference;
        //send verify transaction request every 5 seconds for 30 minutes till transaction is completed
        let interval = setInterval(function() {
            $.ajax({
                url: url,
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + bearerToken
                },
                success: function(response) {
                    console.log('verify_card', response)
                    if (response.status == 'success') {
                        if (response.data.status == 'successful') {
                            alert('Transaction successful');
                            clearInterval(interval);
                        } else if (response.data.status == 'failed') {
                            alert('Transaction failed');
                            clearInterval(interval);
                        } else {
                            console.log('Transaction pending');
                        }
                    } else {
                        alert('Transaction failed');
                        clearInterval(interval);
                    }
                },
                error: function(error) {
                    console.log('error', error)
                        // alert('error occured')
                }
            })
        }, 8000);
    }
} else {
    alert('Transaction failed');
}
