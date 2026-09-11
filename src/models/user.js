import mongoose from "mongoose";
import bcrypt from "bcrypt";
import e from "express";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
        validator: function(value) {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);
        },
        message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [3, 'Password must be at least 3 characters long.'],
        validate: {
        validator: function(value) {
            // Requires at least one uppercase letter, one lowercase letter, and one number
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
        },
        // Prevents the password from showing up in global queries by default
        select: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        default: null
    },
    role: { 
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { timestamps: true });


userSchema.pre('save', async function () {
    console.log("Pre-save hook triggered for user:", this);
  // Only hash the password if it has been modified or is new
  if (!this.isModified('password')) {
    return;
  }

  try {
    // Generate a salt with a cost factor of 12
    const salt = await bcrypt.genSalt(12);
    
    // Hash the password using the generated salt
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; 
  }
});

// 3. Optional: Add a method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!candidatePassword || !this.password) {
        throw new Error("Password fields are missing. Ensure password is selected in the query using .select('+password')");
    }
    
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(`Password comparison failed: ${error.message}`);
    }
};

export default mongoose.model("User", userSchema);