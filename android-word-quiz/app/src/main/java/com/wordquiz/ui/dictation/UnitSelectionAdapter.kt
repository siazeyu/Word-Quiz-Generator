package com.wordquiz.ui.dictation

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wordquiz.data.model.Unit
import com.wordquiz.databinding.ItemUnitSelectionBinding

class UnitSelectionAdapter(
    private val onSelectionChanged: (Long, Boolean) -> Unit
) : ListAdapter<Unit, UnitSelectionAdapter.UnitSelectionViewHolder>(UnitDiffCallback()) {

    private val selectedUnits = mutableSetOf<Long>()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UnitSelectionViewHolder {
        val binding = ItemUnitSelectionBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return UnitSelectionViewHolder(binding)
    }

    override fun onBindViewHolder(holder: UnitSelectionViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class UnitSelectionViewHolder(
        private val binding: ItemUnitSelectionBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(unit: Unit) {
            binding.checkbox.text = unit.name
            binding.checkbox.isChecked = selectedUnits.contains(unit.id)

            binding.checkbox.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    selectedUnits.add(unit.id)
                } else {
                    selectedUnits.remove(unit.id)
                }
                onSelectionChanged(unit.id, isChecked)
            }
        }
    }

    class UnitDiffCallback : DiffUtil.ItemCallback<Unit>() {
        override fun areItemsTheSame(oldItem: Unit, newItem: Unit): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Unit, newItem: Unit): Boolean {
            return oldItem == newItem
        }
    }
}
