
<?php
session_start();
include_once '../Model/Model_Inicio.php';

// Cosas de control register
if (isset($_SESSION['idusuario'])) {
    // guardamos enuna variable el id de usuario que se acaba de registrar ( para hacer la relacion)
    $idusu = $_SESSION['idusuario'];
    $Email = $_SESSION['Email'];
    $Contrasena = $_SESSION['Contrasena'];
    // lo tieve que ahcer asi pq no me funcionaba,Verificar luego si se puede hcer mejor
    $usuario = new User($Email, $Contrasena);


    // si toco el boton
    if (isset($_POST['btnEmpresa'])) {

        $RazonSocial = $_POST['txtRazonSocial'];
        $Ubicacion = $_POST['txtUbicacion'];

        // verifica si el iddeusuario ya tiene un id trasportista
        $usuario->VerificarEmpresa($usuario, $idusu);


        if ($usuario->errno == 700) {
         
            // No deberia entrar nunca aca teoricamente
            $msg = "Ya tiene un ID_Empresa";
            
        } else {
                // sino esta registrado el trasportista lo registra y redireciona a la pagina
                $usuario->registrarEmpresa($idusu, $RazonSocial, $Ubicacion);

                // Redirecinar a pagina de empresa(falta)
                header('Location:Empresa/empresa.php');
        }
    }






    // Sino llego ninguna variable hay un prolema y se redireciona a la anterior pagina
} else {
 
    header('Location:register.php');
   
}
$msg = "";

// Trae la vista
//include_once '../Vista/header.html';
include_once '../Vista/Empresa/registerEmpresa.html';
//include_once '../Vista/pie_vista.php';
?>