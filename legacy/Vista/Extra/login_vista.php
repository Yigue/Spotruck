<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spotruck</title>
    <link rel="stylesheet" href="css/estilos.css">
</head>

<body>
    <header>
        <h1>Spotrack</h1>
        <!-- <h2>NOSE</h2> -->
    </header>

    <content>

        <div class="window">
            <div class="window_title">
                Log
            </div>
            <div class="window_container">

                <form action="login_control.php" method="POST">
                    <label class="lbl" for="txtEmail">Email:</label>
                    <input class="txt" type="text" id="txtEmail" name="txtEmail" required>

                    <label class="lbl" for="txtContraseña">Contraseña:</label>
                    <input class="txt" type="password" id="txtContraseña" name="txtContraseña" required>
                    <!-- ERROR PARA CUANDO TENGAMOS BASE DE DATOS  -->
                    <div class="window_error">
                        <h6>
                            {{MENSAJE}}
                        </h6>
                    </div>


                    <div class="window_control"><input type="submit" class="btn" id="btnLogin" name="btnLogin" value="Login"></div>

                    <div class="window_options">
                        ¿No tienes cuenta? <a href="Register_Control.php" class="lnk">Registrate.</a>
                    </div>
                </form>

            </div>
        </div>

    </content>