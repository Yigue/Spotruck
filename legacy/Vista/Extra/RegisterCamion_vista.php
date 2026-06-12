<body>

    <header>
        <h1>Spotruck</h1>
        <h2>HOLA</h2>
    </header>

    <!--           ---      PARTE CAMIONERO          ---     -->

    <content>
        <div class="window" id="ParteCamionero">
            <div class="window_title">
                Registrarse
            </div>

            <div class="window_container">
                <form action="" method="POST">

                    <label class="lbl" for="txtLicencia">Licencia</label>
                    <input class="txt" type="text" id="txtLicencia" name="txtLicencia" required>

                    <label class="lbl" for="txtzona">Zona Preferida</label>
                    <input class="txt" type="text" id="txtzona" name="txtzona" required>


                    <div class="window_error">
                        <h6>
                            {{MENSAJE}}
                        </h6>
                    </div>

                    <div class="window_control">

                        <div class="window_control"> <input id="btnTrasportista" name="btnTrasportista" class="btn" type="submit" value="Registrarse"></input></div>

                        <div class="window_options"> ¿Quieres Completar la informacion luego? <a href="../index.php" class="lnk">Si.</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </content>