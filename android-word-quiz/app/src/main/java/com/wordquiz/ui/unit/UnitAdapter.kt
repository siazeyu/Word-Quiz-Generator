package com.wordquiz.ui.unit

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wordquiz.data.model.Unit
import com.wordquiz.databinding.ItemUnitBinding

class UnitAdapter(
    private val onItemClick: (Unit) -> Unit,
    private val onItemLongClick: (Unit) -> Unit
) : ListAdapter<Unit, UnitAdapter.UnitViewHolder>(UnitDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UnitViewHolder {
        val binding = ItemUnitBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return UnitViewHolder(binding)
    }

    override fun onBindViewHolder(holder: UnitViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class UnitViewHolder(
        private val binding: ItemUnitBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(unit: Unit) {
            binding.tvName.text = unit.name

            binding.root.setOnClickListener { onItemClick(unit) }
            binding.root.setOnLongClickListener {
                onItemLongClick(unit)
                true
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
