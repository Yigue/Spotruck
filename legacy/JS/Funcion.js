
document.getElementById('ParteEmpresa').style.display = 'none';

document.getElementById('ParteCamionero').style.display = 'none';

function ocultar1() {
    document.getElementById('p1').style.display = 'none';

    if (document.getElementById('UsCam').checked) {
        document.getElementById('ParteCamionero').style.display = 'inline';
    } else {
        document.getElementById('ParteEmpresa').style.display = 'inline';
    }

}
