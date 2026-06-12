<?php

session_start();
if(isset($_SESSION['usuario'])){
    header("Location: ../index.php");
}
include_once '../Model/Model_Inicio.php';
include_once 'validar.php';


// Cosas de control register
$msg="";

$resultado="";

if (isset($_POST['btnpart1'])) {

    // pasamos el contenido de los input a variables
    $Email = $_POST['txtemail'];
    $Contrasena = $_POST['txtContrasena'];
    $ContrasenaRP = $_POST['txtContrasenaRP'];
    $Cuit = $_POST['txtCUIT'];
    $Nombre = $_POST['txtNombre'];
    $Tel = $_POST['txtTel'];
    $TipoUsuario = $_POST['TipUS'];

    if(checkEmail($Email)==true){
        if (isValid($Cuit)==true){

            if (isStrongPassword($Contrasena)==true) {
                if($Contrasena==$ContrasenaRP){

                    // instanciamos el objeto User con los datos de los input
                    $usuario = new User($Email, $Contrasena);
                    // valida que el Email no se repita
                    $usuario->EmailRepeat($usuario);
                        // En El model Comprabamos si el Email esta registrado
                        if($usuario->errno==504){
                            // echo "Se registro";
                            $usuario->registrarse($TipoUsuario,$Cuit,$Nombre,$Tel);
                            $_SESSION['usuario'] = $usuario;
                            //Pongo las variabels de sesion asi pq el de arriba me tira error
                            $_SESSION['ID_USUARIO'] =$usuario->idUsuario;
                            $_SESSION['email'] = $usuario->Email;
                            $_SESSION['password'] = $usuario->Contrasena;
                            if($TipoUsuario==1){
                                header('Location:camionero.php');
                            }else if($TipoUsuario==2){
                                header('Location:empresa.php');
                            }
                }else{
                    //Si el email ya esta registrado en la base de datos
                    $msg="El email ya esta egistrado, intente nuevamente";
                }
                }else{
                    $msg="Las Contraseñas no coiciden";
                }
            }else{
                $msg = "La contraseña debe tener como mínimo un numero,  una letra minúscula, una letra mayúscula y un carácter especial";
            }
        }else{
            $msg = "Cuit invalido";
        }

    }else{
        $msg = "El email no existe";
    }
}


    // Trae la vistas $msg="Las Contraseñas no coiciden";
    //include_once '../Vista/header.html';
    //include '../Vista/register.html';
    //include_once '../Vista/pie_vista.php';

    $tpl_landig = file_get_contents('../Vista/register.html');
    $new_landig = str_replace("{{MENSAJE}}", $msg, $tpl_landig);
    echo $new_landig;

?>
    <!-- <script>
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
    </script> -->