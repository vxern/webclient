self.window = {crypto: self.crypto}; // to make UMD bundles work

importScripts('/openpgp.min.js');
var openpgp = window.openpgp;

var decryptedPrivKeyObj;

onmessage = function (event) {
    if (event.data.clear) {
        decryptedPrivKeyObj = null;
    }
    else if (event.data.generateKeys) {
        generateKeys(event.data.options).then((data) => {
            postMessage({generateKeys: true, keys: data, callerId: event.data.callerId, forEmail: !!event.data.forEmail});
        })
    }
    else if (event.data.decryptSecureMessageKey) {
	    const privKeyObj = openpgp.key.readArmored(event.data.privKey).keys[0];
	    privKeyObj.decrypt(event.data.password);
	    postMessage({decryptSecureMessageKey: true, decryptedKey: privKeyObj});
    }
    else if (event.data.decryptSecureMessageContent) {
	    if (!event.data.content) {
		    postMessage({decryptedContent: event.data.content, decryptSecureMessageContent: true});
	    } else {
		    decryptContent(event.data.content, event.data.decryptedKey).then((data) => {
			    postMessage({decryptedContent: data, decryptSecureMessageContent: true});
		    })
	    }
    }
    else if (!decryptedPrivKeyObj) {
        decryptedPrivKeyObj = openpgp.key.readArmored(event.data.privkey).keys[0];
        decryptedPrivKeyObj.decrypt(event.data.user_key);
        postMessage({key: decryptedPrivKeyObj});
    }
    else if (event.data.decrypt) {
        if (!event.data.content) {
            postMessage({decryptedContent: event.data.content, decrypted: true, callerId: event.data.callerId});
        } else {
            decryptContent(event.data.content, decryptedPrivKeyObj).then((data) => {
                postMessage({decryptedContent: data, decrypted: true, callerId: event.data.callerId});
            })
        }
    }
}

function decryptContent(data, privKeyObj) {
    const options = {
        message: openpgp.message.readArmored(data),
        privateKeys: [privKeyObj]
    };

    return openpgp.decrypt(options).then(plaintext => {
        return plaintext.data;
    })
}

function generateKeys(options) {
    return openpgp.generateKey(options).then(key => {
        return {
            public_key: key.publicKeyArmored,
            private_key: key.privateKeyArmored,
            fingerprint: openpgp.key.readArmored(key.publicKeyArmored).keys[0].primaryKey.getFingerprint()
        };
    });
}

